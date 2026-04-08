import logging
import re
from datetime import datetime, timezone, timedelta, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.webhook import IntelliHQWebhookPayload
from app.db.models.subscription import Subscription, SubscriptionStatus, PaymentProvider
from app.db.models.subscription_plan import SubscriptionPlan, PlanPeriod
from app.db.models.player import Player
from app.repositories.player_repository import PlayerRepository

logger = logging.getLogger(__name__)

class WebhookService:
    """Service for handling IntelliHQ webhook notifications"""
    
    @staticmethod
    def normalize_phone_number(phone: str) -> str:
        """
        Normalize phone number to Nigerian format (0xxxxxxxxxx)
        
        Args:
            phone: Phone number in various formats
            
        Returns:
            Normalized phone number starting with 0
            
        Raises:
            ValueError: If phone number is invalid
        """
        # Remove all non-digit characters
        phone = re.sub(r'\D', '', phone)
        
        # Handle different formats
        if phone.startswith('234'):
            # +234 or 234 format
            phone = '0' + phone[3:]
        elif phone.startswith('0'):
            # Already in correct format
            pass
        else:
            # Assume it's missing the leading 0
            phone = '0' + phone
        
        # Validate length (should be 11 digits: 0 + 10 digits)
        if len(phone) != 11 or not phone.startswith('0'):
            raise ValueError(f"Invalid phone number format: {phone}")
        
        return phone
    
    @staticmethod
    async def handle_renewal_notification(
        db: AsyncSession,
        payload: IntelliHQWebhookPayload
    ) -> Subscription:
        """
        Handle subscription renewal notification
        
        Updates existing subscription with new expiry date
        """
        try:
            # Normalize phone number
            msisdn = WebhookService.normalize_phone_number(payload.details.phone)
            telco_ref = payload.details.telco_ref
            
            logger.info(f"Processing renewal for {msisdn}, ref: {telco_ref}")
            
            # Get player
            player = await PlayerRepository.get_by_msisdn(db, msisdn)
            if not player:
                # Create player if doesn't exist
                player = await PlayerRepository.get_or_create_by_msisdn(
                    db=db,
                    msisdn=msisdn,
                    telco=payload.telco or "MTN"
                )
            
            # Get active subscription
            result = await db.execute(
                select(Subscription).where(
                    Subscription.player_id == player.id,
                    Subscription.provider == PaymentProvider.INTELLIHQ,
                    Subscription.status == SubscriptionStatus.ACTIVE
                ).order_by(Subscription.ends_at.desc())
            )
            subscription = result.scalar_one_or_none()
            
            if subscription:
                # Check for duplicate processing (idempotency)
                if subscription.payment_data and subscription.payment_data.get("last_renewal_ref") == telco_ref:
                    logger.info(f"Renewal {telco_ref} already processed, skipping")
                    return subscription
                
                # Parse expiry date and set to end of day
                try:
                    new_expiry = datetime.strptime(payload.details.expiry, "%Y-%m-%d")
                    # Set to end of day (23:59:59)
                    new_expiry = datetime.combine(new_expiry.date(), time(23, 59, 59))
                    new_expiry = new_expiry.replace(tzinfo=timezone.utc)
                    
                    subscription.ends_at = new_expiry
                    subscription.next_billing_at = new_expiry
                    subscription.updated_at = datetime.now(timezone.utc)
                    
                    # Update metadata
                    if not subscription.payment_data:
                        subscription.payment_data = {}
                    subscription.payment_data["last_renewal_ref"] = telco_ref
                    subscription.payment_data["last_renewal_date"] = datetime.now(timezone.utc).isoformat()
                    
                    # Update player subscription data
                    player.has_any_subscription = True
                    player.has_active_subscription = True
                    player.subscription_data = {
                        "subscription_id": subscription.id,
                        "plan_id": subscription.plan_id,
                        "status": subscription.status.value,
                        "ends_at": new_expiry.isoformat(),
                        "telco_ref": telco_ref
                    }
                    
                    await db.commit()
                    await db.refresh(subscription)
                    logger.info(f"Renewed subscription {subscription.id} until {new_expiry}")
                    return subscription
                except ValueError as e:
                    logger.error(f"Failed to parse expiry date: {payload.details.expiry}, error: {str(e)}")
                    raise
            else:
                # No active subscription found, treat as new subscription
                logger.warning(f"No active subscription found for renewal, creating new for {msisdn}")
                return await WebhookService.handle_sync_notification(db, payload)
                
        except Exception as e:
            logger.error(f"Error processing renewal notification: {str(e)}", exc_info=True)
            await db.rollback()
            raise
    
    @staticmethod
    async def handle_sync_notification(
        db: AsyncSession,
        payload: IntelliHQWebhookPayload
    ) -> Subscription:
        """
        Handle new subscription notification
        
        Creates new subscription record
        """
        try:
            # Normalize phone number
            msisdn = WebhookService.normalize_phone_number(payload.details.phone)
            telco_ref = payload.details.telco_ref
            
            logger.info(f"Processing new subscription for {msisdn}, ref: {telco_ref}")
            
            # Check if subscription with this reference already exists (idempotency)
            result = await db.execute(
                select(Subscription).where(
                    Subscription.payment_reference == telco_ref,
                    Subscription.provider == PaymentProvider.INTELLIHQ
                )
            )
            existing_subscription = result.scalar_one_or_none()
            
            if existing_subscription:
                logger.info(f"Subscription with ref {telco_ref} already exists: {existing_subscription.id}")
                return existing_subscription
            
            # Get or create player
            player = await PlayerRepository.get_or_create_by_msisdn(
                db=db,
                msisdn=msisdn,
                telco=payload.telco or "MTN"
            )
            
            # Get daily plan (airtime subscriptions are daily)
            result = await db.execute(
                select(SubscriptionPlan).where(
                    SubscriptionPlan.period == PlanPeriod.DAILY,
                    SubscriptionPlan.is_active == True
                )
            )
            plan = result.scalar_one_or_none()
            
            if not plan:
                raise ValueError("Daily subscription plan not found")
            
            # Parse dates
            try:
                starts_at = datetime.strptime(payload.details.date, "%Y-%m-%d %H:%M:%S")
                starts_at = starts_at.replace(tzinfo=timezone.utc)
                
                # Parse expiry date and set to end of day
                ends_at = datetime.strptime(payload.details.expiry, "%Y-%m-%d")
                ends_at = datetime.combine(ends_at.date(), time(23, 59, 59))
                ends_at = ends_at.replace(tzinfo=timezone.utc)
            except ValueError as e:
                logger.error(f"Failed to parse dates: {str(e)}")
                raise
            
            # Create subscription
            subscription = Subscription(
                player_id=player.id,
                plan_id=plan.id,
                status=SubscriptionStatus.ACTIVE,
                provider=PaymentProvider.INTELLIHQ,
                payment_reference=telco_ref,
                intellihq_subscription_id=int(payload.details.sequence_no) if payload.details.sequence_no else None,
                starts_at=starts_at,
                ends_at=ends_at,
                next_billing_at=ends_at,
                auto_renew=payload.details.auto_renewal,
                metadata={
                    "channel": payload.details.channel,
                    "product_id": payload.product.id,
                    "product_name": payload.product.name,
                    "amount": payload.details.amount,
                    "telco_status_code": payload.details.telco_status_code,
                    "created_via_webhook": True
                }
            )
            
            db.add(subscription)
            
            # Update player subscription status
            player.has_any_subscription = True
            player.has_active_subscription = True
            player.subscription_data = {
                "subscription_id": subscription.id,
                "plan_id": plan.id,
                "status": SubscriptionStatus.ACTIVE.value,
                "starts_at": starts_at.isoformat(),
                "ends_at": ends_at.isoformat(),
                "telco_ref": telco_ref
            }
            
            await db.commit()
            await db.refresh(subscription)
            logger.info(f"Created subscription {subscription.id} for player {player.id}")
            return subscription
            
        except Exception as e:
            logger.error(f"Error processing sync notification: {str(e)}", exc_info=True)
            await db.rollback()
            raise
    
    @staticmethod
    async def handle_unsubscription_notification(
        db: AsyncSession,
        payload: IntelliHQWebhookPayload
    ) -> Subscription:
        """
        Handle unsubscription notification
        
        Cancels active subscription
        """
        try:
            # Normalize phone number
            msisdn = WebhookService.normalize_phone_number(payload.details.phone)
            telco_ref = payload.details.telco_ref
            
            logger.info(f"Processing unsubscription for {msisdn}, ref: {telco_ref}")
            
            # Get player
            player = await PlayerRepository.get_by_msisdn(db, msisdn)
            if not player:
                logger.warning(f"Player not found for phone: {msisdn}")
                raise ValueError(f"Player not found for phone: {msisdn}")
            
            # Get active subscription
            result = await db.execute(
                select(Subscription).where(
                    Subscription.player_id == player.id,
                    Subscription.provider == PaymentProvider.INTELLIHQ,
                    Subscription.status == SubscriptionStatus.ACTIVE
                ).order_by(Subscription.ends_at.desc())
            )
            subscription = result.scalar_one_or_none()
            
            if not subscription:
                logger.warning(f"No active subscription found for player: {msisdn}")
                raise ValueError(f"No active subscription found for player: {msisdn}")
            
            # Check for duplicate processing
            if subscription.status == SubscriptionStatus.CANCELLED:
                if subscription.payment_data and subscription.payment_data.get("cancellation_ref") == telco_ref:
                    logger.info(f"Cancellation {telco_ref} already processed, skipping")
                    return subscription
            
            # Cancel subscription
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.auto_renew = False
            subscription.updated_at = datetime.now(timezone.utc)
            
            # Update metadata
            if not subscription.payment_data:
                subscription.payment_data = {}
            subscription.payment_data["cancellation_ref"] = telco_ref
            subscription.payment_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
            
            # Update player subscription status
            player.has_any_subscription = True  # Keep history
            player.has_active_subscription = False
            player.subscription_data = {
                "subscription_id": subscription.id,
                "plan_id": subscription.plan_id,
                "status": SubscriptionStatus.CANCELLED.value,
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
                "telco_ref": telco_ref
            }
            
            await db.commit()
            await db.refresh(subscription)
            logger.info(f"Cancelled subscription {subscription.id} for player {player.id}")
            return subscription
            
        except Exception as e:
            logger.error(f"Error processing unsubscription notification: {str(e)}", exc_info=True)
            await db.rollback()
            raise
    
    @staticmethod
    async def process_webhook(
        db: AsyncSession,
        payload: IntelliHQWebhookPayload
    ) -> Subscription:
        """
        Process webhook based on notification type
        """
        if payload.type == "RENEWAL_NOTIFICATION":
            return await WebhookService.handle_renewal_notification(db, payload)
        elif payload.type == "SYNC_NOTIFICATION":
            return await WebhookService.handle_sync_notification(db, payload)
        elif payload.type == "UNSUBSCRIPTION_NOTIFICATION":
            return await WebhookService.handle_unsubscription_notification(db, payload)
        else:
            raise ValueError(f"Unknown notification type: {payload.type}")
