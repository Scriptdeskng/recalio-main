import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.models.subscription import Subscription, SubscriptionStatus, PaymentProvider
from app.db.models.subscription_plan import SubscriptionPlan
from app.services.payment import get_paystack_provider
from app.repositories.player_repository import PlayerRepository

logger = logging.getLogger(__name__)

class RecurringChargeService:
    """
    Service for processing recurring subscription charges
    
    This service finds subscriptions that need renewal and charges them
    using saved authorization codes.
    """
    
    @staticmethod
    async def process_pending_renewals(
        db: AsyncSession,
        days_before_expiry: int = 1
    ) -> dict:
        """
        Process subscriptions that are about to expire
        
        Args:
            db: Database session
            days_before_expiry: How many days before expiry to charge (default: 1)
            
        Returns:
            Dictionary with success and failure counts
        """
        logger.info(f"Starting recurring charge processing (days_before_expiry={days_before_expiry})")
        
        # Calculate the threshold date
        now = datetime.now(timezone.utc)
        
        # Find active Paystack subscriptions that:
        # 1. Have authorization_code saved
        # 2. Are set to auto-renew
        # 3. next_billing_at has arrived (or passed)
        result = await db.execute(
            select(Subscription).where(
                and_(
                    Subscription.provider == PaymentProvider.PAYSTACK,
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    Subscription.auto_renew == True,
                    Subscription.authorization_code.isnot(None),
                    Subscription.next_billing_at <= now
                )
            )
        )
        subscriptions = result.scalars().all()
        
        logger.info(f"Found {len(subscriptions)} subscriptions due for renewal")
        
        success_count = 0
        failure_count = 0
        results = []
        
        for subscription in subscriptions:
            try:
                result = await RecurringChargeService._charge_subscription(db, subscription)
                if result["success"]:
                    success_count += 1
                else:
                    failure_count += 1
                results.append(result)
            except Exception as e:
                logger.error(f"Error charging subscription {subscription.id}: {str(e)}", exc_info=True)
                failure_count += 1
                results.append({
                    "success": False,
                    "subscription_id": subscription.id,
                    "error": str(e)
                })
        
        logger.info(f"Recurring charge processing complete: {success_count} succeeded, {failure_count} failed")
        
        return {
            "total": len(subscriptions),
            "success": success_count,
            "failure": failure_count,
            "results": results
        }
    
    @staticmethod
    async def _charge_subscription(
        db: AsyncSession,
        subscription: Subscription
    ) -> dict:
        """
        Charge a single subscription using saved authorization code
        
        Args:
            db: Database session
            subscription: Subscription to charge
            
        Returns:
            Dictionary with charge result
        """
        logger.info(f"Charging subscription {subscription.id} for renewal")
        
        if not subscription.authorization_code:
            logger.error(f"Subscription {subscription.id} has no authorization_code")
            return {
                "success": False,
                "subscription_id": subscription.id,
                "error": "No authorization code saved"
            }
        
        if not subscription.email:
            logger.error(f"Subscription {subscription.id} has no email")
            return {
                "success": False,
                "subscription_id": subscription.id,
                "error": "No email saved"
            }
        
        # Get plan details
        result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == subscription.plan_id)
        )
        plan = result.scalar_one_or_none()
        
        if not plan:
            logger.error(f"Plan {subscription.plan_id} not found for subscription {subscription.id}")
            return {
                "success": False,
                "subscription_id": subscription.id,
                "error": f"Plan {subscription.plan_id} not found"
            }
        
        # Prepare metadata for the charge
        # IMPORTANT: Include subscription_id so webhook can process the renewal
        metadata = {
            "subscription_id": subscription.id,
            "player_id": subscription.player_id,
            "plan_id": plan.id,
            "plan_period": plan.period.value,
            "payment_type": "renewal",  # Mark as renewal so webhook knows how to handle it
            "renewal_date": datetime.now(timezone.utc).isoformat(),
            "previous_end_date": subscription.ends_at.isoformat()
        }
        
        # Charge the authorization code
        provider = get_paystack_provider()
        
        try:
            transaction = await provider.charge_authorization(
                authorization_code=subscription.authorization_code,
                email=subscription.email,
                amount=plan.price,
                metadata=metadata
            )
            
            logger.info(f"Successfully charged subscription {subscription.id}, reference: {transaction.reference}")
            
            # The webhook will handle updating the subscription
            # We just mark that we attempted the charge
            if not subscription.payment_metadata:
                subscription.payment_metadata = {}
            subscription.payment_metadata["last_renewal_attempt"] = datetime.now(timezone.utc).isoformat()
            subscription.payment_metadata["last_renewal_reference"] = transaction.reference
            subscription.payment_metadata.pop("retry_count", None)  # Clear retry count on success
            
            await db.commit()
            
            return {
                "success": True,
                "subscription_id": subscription.id,
                "reference": transaction.reference,
                "amount": plan.price,
                "status": transaction.status
            }
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"Failed to charge subscription {subscription.id}: {error_message}")
            
            # Update metadata with failure
            if not subscription.payment_metadata:
                subscription.payment_metadata = {}
            
            # Track retry attempts
            retry_count = subscription.payment_metadata.get("retry_count", 0) + 1
            subscription.payment_metadata["retry_count"] = retry_count
            subscription.payment_metadata["last_renewal_attempt"] = datetime.now(timezone.utc).isoformat()
            subscription.payment_metadata["last_renewal_error"] = error_message
            
            # Check if authorization code is invalid/expired
            if "authorization" in error_message.lower() or "invalid" in error_message.lower():
                logger.error(f"Authorization code invalid for subscription {subscription.id}")
                subscription.authorization_code = None  # Clear invalid code
                subscription.auto_renew = False  # Stop auto-renewal
                subscription.status = SubscriptionStatus.SUSPENDED
                subscription.payment_metadata["suspension_reason"] = "Invalid authorization code"
            elif retry_count >= 3:
                # After 3 failed attempts, move to grace period
                logger.warning(f"Subscription {subscription.id} failed {retry_count} times, moving to GRACE")
                subscription.status = SubscriptionStatus.GRACE
                subscription.payment_metadata["grace_reason"] = f"Payment failed {retry_count} times"
            else:
                # Keep active but log the failure - will retry next run
                logger.info(f"Subscription {subscription.id} failed (attempt {retry_count}/3), will retry")
            
            subscription.updated_at = datetime.now(timezone.utc)
            await db.commit()
            
            return {
                "success": False,
                "subscription_id": subscription.id,
                "error": error_message,
                "retry_count": retry_count
            }
    
    @staticmethod
    async def charge_specific_subscription(
        db: AsyncSession,
        subscription_id: int
    ) -> dict:
        """
        Manually trigger renewal charge for a specific subscription
        
        Useful for testing or manual intervention
        
        Args:
            db: Database session
            subscription_id: ID of subscription to charge
            
        Returns:
            Charge result dictionary
        """
        result = await db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            return {
                "success": False,
                "subscription_id": subscription_id,
                "error": "Subscription not found"
            }
        
        return await RecurringChargeService._charge_subscription(db, subscription)
