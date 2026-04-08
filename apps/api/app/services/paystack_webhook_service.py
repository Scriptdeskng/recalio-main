import logging
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.schemas.webhook import PaystackWebhookPayload
from app.db.models.subscription import Subscription, SubscriptionStatus, PaymentProvider
from app.db.models.subscription_plan import SubscriptionPlan
from app.repositories.player_repository import PlayerRepository
from app.core.config import settings

logger = logging.getLogger(__name__)

class PaystackWebhookService:
    """Service for handling Paystack webhook notifications"""
    
    @staticmethod
    def verify_signature(payload: bytes, signature: str) -> bool:
        """
        Verify that webhook came from Paystack using HMAC SHA512
        
        Args:
            payload: Raw request body as bytes
            signature: Value from x-paystack-signature header
            
        Returns:
            bool: True if signature is valid
        """
        if not signature:
            logger.warning("No signature provided in webhook")
            return False
        
        # Validate secret key is configured
        if not settings.PAYSTACK_SECRET_KEY:
            logger.error("PAYSTACK_SECRET_KEY not configured")
            return False
        
        # Compute hash of payload using secret key
        computed_hash = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        # Compare with provided signature
        is_valid = hmac.compare_digest(computed_hash, signature)
        
        if not is_valid:
            logger.warning(f"Invalid webhook signature. Expected: {computed_hash[:10]}..., Got: {signature[:10]}...")
        
        return is_valid
    
    @staticmethod
    async def handle_charge_success(
        db: AsyncSession,
        payload: PaystackWebhookPayload
    ) -> Subscription:
        """
        Handle successful charge event
        
        This can be:
        1. Initial subscription payment (payment_type=initial in metadata)
        2. Recurring charge for subscription renewal (payment_type=renewal in metadata)
        
        For initial payments without subscription_id, we look up by reference.
        For recurring charges, we MUST have subscription_id in metadata.
        """
        data = payload.data
        reference = data.reference
        
        logger.info(f"Processing charge.success for reference: {reference}")
        
        try:
            # Check if this is a renewal charge (has subscription metadata)
            metadata = data.payment_data or {}
            subscription_id = metadata.get("subscription_id")
            payment_type = metadata.get("payment_type", "initial")
            
            if not subscription_id:
                # This is likely the initial payment without subscription_id in metadata
                # (can happen if payment was made before we updated the code)
                logger.info(f"No subscription_id in metadata, looking up by reference: {reference}")
                result = await db.execute(
                    select(Subscription).where(
                        Subscription.payment_reference == reference
                    )
                )
                subscription = result.scalar_one_or_none()
                
                if subscription:
                    logger.info(f"Found existing subscription {subscription.id} for reference {reference}")
                    # This is the initial payment being confirmed via webhook
                    # Already handled by verify_payment endpoint, just return it
                    return subscription
                else:
                    logger.warning(f"No subscription found for reference: {reference}")
                    # Not an error - might be a non-subscription charge
                    return None
            
            # We have subscription_id - check if this is initial or renewal
            result = await db.execute(
                select(Subscription).where(Subscription.id == subscription_id)
            )
            subscription = result.scalar_one_or_none()
            
            if not subscription:
                raise ValueError(f"Subscription not found: {subscription_id}")
            
            # Check for duplicate processing (idempotency)
            if subscription.payment_data and subscription.payment_data.get("last_charge_reference") == reference:
                logger.info(f"Reference {reference} already processed for subscription {subscription_id}, skipping")
                return subscription
            
            # Verify payment was successful
            if data.status != "success":
                logger.warning(f"Charge not successful for subscription {subscription_id}: {data.status}")
                # If renewal failed, move to grace period
                if subscription.status == SubscriptionStatus.ACTIVE:
                    subscription.status = SubscriptionStatus.GRACE
                    subscription.updated_at = datetime.now(timezone.utc)
                    await db.commit()
                return subscription
            
            # Handle based on payment type
            if payment_type == "initial":
                # Initial payment webhook - subscription should already be active from verify_payment
                logger.info(f"Initial payment webhook for subscription {subscription_id}")
                if subscription.status == SubscriptionStatus.PENDING:
                    # Edge case: webhook arrived before verify_payment was called
                    logger.info("Webhook arrived before verify, activating subscription")
                    subscription.status = SubscriptionStatus.ACTIVE
                    # Only save if not already saved
                    if not subscription.authorization_code and data.authorization and data.authorization.authorization_code:
                        subscription.authorization_code = data.authorization.authorization_code
                        logger.info(f"Saved authorization_code from webhook for subscription {subscription_id}")
                    # Set next_billing_at
                    subscription.next_billing_at = subscription.ends_at - timedelta(days=1)
                    subscription.updated_at = datetime.now(timezone.utc)
                    await db.commit()
                return subscription
            
            # This is a RENEWAL charge (payment_type=renewal)
            logger.info(f"Processing renewal charge for subscription {subscription_id}")
            
            # Get subscription plan
            result = await db.execute(
                select(SubscriptionPlan).where(SubscriptionPlan.id == subscription.plan_id)
            )
            plan = result.scalar_one_or_none()
            
            if not plan:
                raise ValueError(f"Plan not found: {subscription.plan_id}")
            
            # Calculate new end date based on plan period
            # IMPORTANT: If subscription expired, extend from now, not from old end date
            now = datetime.now(timezone.utc)
            base_date = max(subscription.ends_at, now)
            
            if plan.period.value == "daily":
                new_end_date = base_date + timedelta(days=1)
            elif plan.period.value == "weekly":
                new_end_date = base_date + timedelta(weeks=1)
            elif plan.period.value == "monthly":
                new_end_date = base_date + timedelta(days=30)
            else:
                raise ValueError(f"Unknown plan period: {plan.period}")
            
            # Update subscription
            subscription.ends_at = new_end_date
            # Set next_billing_at to 1 day before new end date
            subscription.next_billing_at = new_end_date - timedelta(days=1)
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.updated_at = now
            
            # Update metadata with latest charge
            if not subscription.payment_data:
                subscription.payment_data = {}
            subscription.payment_data["last_charge_reference"] = reference
            subscription.payment_data["last_charge_date"] = now.isoformat()
            subscription.payment_data["last_charge_amount"] = data.amount
            subscription.payment_data["last_renewal_success"] = now.isoformat()
            subscription.payment_data["renewal_count"] = subscription.payment_data.get("renewal_count", 0) + 1
            subscription.payment_data.pop("retry_count", None)  # Clear any retry count
            subscription.payment_data.pop("grace_reason", None)  # Clear grace reason if any
            
            # Update player subscription status
            player = await PlayerRepository.get_by_id(db, subscription.player_id)
            if player:
                player.has_any_subscription = True
                player.has_active_subscription = True
                player.subscription_data = {
                    "subscription_id": subscription.id,
                    "plan_id": subscription.plan_id,
                    "status": SubscriptionStatus.ACTIVE.value,
                    "ends_at": new_end_date.isoformat(),
                    "last_renewal": now.isoformat()
                }
            
            await db.commit()
            await db.refresh(subscription)
            logger.info(f"Renewed subscription {subscription.id} until {new_end_date}")
            return subscription
            
        except Exception as e:
            logger.error(f"Error processing charge.success: {str(e)}", exc_info=True)
            await db.rollback()
            raise
    
    @staticmethod
    async def handle_invoice_update(
        db: AsyncSession,
        payload: PaystackWebhookPayload
    ) -> Subscription:
        """
        Handle invoice update event (usually means subscription was charged successfully)
        
        Similar to charge.success but specifically for subscription invoices
        """
        # For now, delegate to charge_success handler
        # You can add invoice-specific logic here if needed
        return await PaystackWebhookService.handle_charge_success(db, payload)
    
    @staticmethod
    async def handle_invoice_payment_failed(
        db: AsyncSession,
        payload: PaystackWebhookPayload
    ) -> Subscription:
        """
        Handle failed invoice payment
        
        Move subscription to grace period
        """
        data = payload.data
        metadata = data.payment_data or {}
        subscription_id = metadata.get("subscription_id")
        reference = data.reference
        
        if not subscription_id:
            logger.warning(f"No subscription_id in failed payment webhook for reference {reference}")
            return None
        
        logger.warning(f"Invoice payment failed for subscription {subscription_id}")
        
        try:
            # Get subscription
            result = await db.execute(
                select(Subscription).where(Subscription.id == subscription_id)
            )
            subscription = result.scalar_one_or_none()
            
            if not subscription:
                raise ValueError(f"Subscription not found: {subscription_id}")
            
            # Check for duplicate processing
            if subscription.payment_data and subscription.payment_data.get("last_failed_charge_reference") == reference:
                logger.info(f"Failed payment {reference} already processed, skipping")
                return subscription
            
            # Move to grace period if currently active or already in grace
            if subscription.status in [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE]:
                subscription.status = SubscriptionStatus.GRACE
                subscription.updated_at = datetime.now(timezone.utc)
                
                # Update metadata with failure info
                if not subscription.payment_data:
                    subscription.payment_data = {}
                subscription.payment_data["last_failed_charge_date"] = datetime.now(timezone.utc).isoformat()
                subscription.payment_data["last_failed_charge_reference"] = reference
                subscription.payment_data["failure_count"] = subscription.payment_data.get("failure_count", 0) + 1
                
                # Update player - keep has_any_subscription but set has_active_subscription to False
                player = await PlayerRepository.get_by_id(db, subscription.player_id)
                if player:
                    player.has_any_subscription = True  # Still has subscription history
                    player.has_active_subscription = False  # But not currently active
                    player.subscription_data = {
                        "subscription_id": subscription.id,
                        "plan_id": subscription.plan_id,
                        "status": SubscriptionStatus.GRACE.value,
                        "ends_at": subscription.ends_at.isoformat(),
                        "payment_failed": True,
                        "failure_count": subscription.payment_data["failure_count"]
                    }
                
                await db.commit()
                await db.refresh(subscription)
                logger.info(f"Moved subscription {subscription.id} to grace period (failure #{subscription.payment_data['failure_count']})")
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error processing failed payment: {str(e)}", exc_info=True)
            await db.rollback()
            raise
    
    @staticmethod
    async def process_webhook(
        db: AsyncSession,
        payload: PaystackWebhookPayload
    ) -> Subscription | None:
        """
        Process webhook based on event type
        
        Returns:
            Subscription if processed, None if event not relevant to subscriptions
        """
        event = payload.event
        
        logger.info(f"Processing Paystack webhook event: {event}")
        
        if event == "charge.success":
            return await PaystackWebhookService.handle_charge_success(db, payload)
        elif event == "invoice.update":
            return await PaystackWebhookService.handle_invoice_update(db, payload)
        elif event == "invoice.payment_failed":
            return await PaystackWebhookService.handle_invoice_payment_failed(db, payload)
        else:
            logger.info(f"Unhandled Paystack event type: {event} - ignoring")
            # Don't raise error for unhandled events - just ignore them
            return None
