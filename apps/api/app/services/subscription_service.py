import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.subscription_plan import SubscriptionPlan, PlanPeriod, PaymentMethod
from app.db.models.subscription import Subscription, SubscriptionStatus, PaymentProvider
from app.db.models.player import Player
from app.services.payment import get_paystack_provider, InitiatePaymentResponse, PaymentTransaction

logger = logging.getLogger(__name__)

class SubscriptionService:
    """Service for managing subscriptions"""
    
    @staticmethod
    async def get_plans(db: AsyncSession) -> list[SubscriptionPlan]:
        """Get all active subscription plans"""
        result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.is_active == True)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_plan_by_period(db: AsyncSession, period: PlanPeriod) -> SubscriptionPlan | None:
        """Get plan by period"""
        result = await db.execute(
            select(SubscriptionPlan).where(
                SubscriptionPlan.period == period,
                SubscriptionPlan.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def initiate_card_payment(
        db: AsyncSession,
        player: Player,
        plan: SubscriptionPlan,
        email: str,
        metadata: Dict[str, Any] | None = None
    ) -> InitiatePaymentResponse:
        """
        Initiate a card payment for subscription
        
        Args:
            db: Database session
            player: Player instance
            plan: Subscription plan
            email: Customer email
            metadata: Additional metadata
            
        Returns:
            InitiatePaymentResponse with authorization URL
        """
        if not plan.has_payment_method(PaymentMethod.CARD):
            raise ValueError(f"Plan {plan.name} does not support card payment")
        
        # Create pending subscription FIRST to get an ID
        subscription = Subscription(
            player_id=player.id,
            plan_id=plan.id,
            status=SubscriptionStatus.PENDING,
            provider=PaymentProvider.PAYSTACK,
            payment_reference="",  # Will update after Paystack call
            email=email,
            starts_at=datetime.now(timezone.utc),
            ends_at=datetime.now(timezone.utc) + SubscriptionService._get_period_delta(plan.period),
            metadata=metadata or {}
        )
        db.add(subscription)
        await db.flush()  # Flush to get ID without committing
        
        # Get Paystack provider
        provider = get_paystack_provider()
        
        # Prepare metadata with subscription_id
        meta = metadata or {}
        meta.update({
            "subscription_id": subscription.id,  # Include subscription_id for webhooks
            "player_id": player.id,
            "plan_id": plan.id,
            "msisdn": player.msisdn,
            "plan_period": plan.period.value,
            "payment_type": "initial"  # Mark as initial payment
        })
        
        # Initialize transaction with Paystack
        response = await provider.initialize_transaction(
            email=email,
            amount=plan.price,
            metadata=meta
        )
        
        if response.success and response.reference:
            # Update subscription with Paystack reference
            subscription.payment_reference = response.reference
            subscription.metadata = meta
            await db.commit()
            logger.info(f"Created pending subscription {subscription.id} for player {player.id}, reference: {response.reference}")
        else:
            # Rollback if Paystack initialization failed
            await db.rollback()
            logger.error(f"Failed to initialize Paystack payment: {response.message}")
        
        return response
    
    @staticmethod
    async def verify_and_activate_subscription(
        db: AsyncSession,
        reference: str
    ) -> Subscription:
        """
        Verify payment and activate subscription
        
        Args:
            db: Database session
            reference: Payment reference
            
        Returns:
            Activated subscription
        """
        # Get subscription by reference
        result = await db.execute(
            select(Subscription).where(Subscription.payment_reference == reference)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            raise ValueError(f"Subscription not found for reference: {reference}")
        
        if subscription.status != SubscriptionStatus.PENDING:
            logger.warning(f"Subscription {subscription.id} already processed with status: {subscription.status}")
            return subscription
        
        # Verify payment with Paystack
        provider = get_paystack_provider()
        transaction = await provider.verify_transaction(reference)
        
        if transaction.status == "success":
            # Update subscription - only save authorization_code if not already saved
            subscription.status = SubscriptionStatus.ACTIVE
            if not subscription.authorization_code:
                subscription.authorization_code = transaction.authorization_code
                logger.info(f"Saved authorization_code for subscription {subscription.id}")
            else:
                logger.info(f"Authorization_code already exists for subscription {subscription.id}")
            
            # Set next_billing_at to trigger renewal 1 day before expiry
            subscription.next_billing_at = subscription.ends_at - timedelta(days=1)
            
            # Preserve existing metadata and add transaction info
            if not subscription.metadata:
                subscription.metadata = {}
            subscription.metadata.update({
                "activated_at": datetime.now(timezone.utc).isoformat(),
                "initial_transaction_ref": transaction.reference,
                "payment_channel": transaction.channel
            })
            
            # Update player subscription status
            player_result = await db.execute(
                select(Player).where(Player.id == subscription.player_id)
            )
            player = player_result.scalar_one()
            player.has_any_subscription = True
            player.has_active_subscription = True
            player.subscription_data = {
                "subscription_id": subscription.id,
                "plan_id": subscription.plan_id,
                "status": subscription.status.value,
                "starts_at": subscription.starts_at.isoformat(),
                "ends_at": subscription.ends_at.isoformat(),
                "next_billing_at": subscription.next_billing_at.isoformat()
            }
            
            await db.commit()
            await db.refresh(subscription)
            logger.info(f"Activated subscription {subscription.id} for player {player.id}")
            return subscription
        else:
            raise Exception(f"Payment verification failed: {transaction.status}")
    
    @staticmethod
    async def get_active_subscription(
        db: AsyncSession,
        player_id: int
    ) -> Subscription | None:
        """Get player's active subscription"""
        result = await db.execute(
            select(Subscription).where(
                Subscription.player_id == player_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).order_by(Subscription.ends_at.desc())
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    def _get_period_delta(period: PlanPeriod) -> timedelta:
        """Get timedelta for subscription period"""
        if period == PlanPeriod.DAILY:
            return timedelta(days=1)
        elif period == PlanPeriod.WEEKLY:
            return timedelta(weeks=1)
        elif period == PlanPeriod.MONTHLY:
            return timedelta(days=30)
        else:
            raise ValueError(f"Unknown period: {period}")
