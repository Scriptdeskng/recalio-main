from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.subscription import (
    SubscriptionPlanResponse,
    InitiateCardPaymentRequest,
    InitiatePaymentResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    SubscriptionResponse
)
from app.services.subscription_service import SubscriptionService
from app.db.models.subscription_plan import PlanPeriod
from app.repositories.player_repository import PlayerRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])

@router.get("/plans", response_model=list[SubscriptionPlanResponse])
async def get_subscription_plans(db: AsyncSession = Depends(get_db)):
    """Get all available subscription plans"""
    try:
        plans = await SubscriptionService.get_plans(db)
        return [
            SubscriptionPlanResponse(
                id=plan.id,
                name=plan.name,
                period=plan.period.value,
                price=plan.price,
                allowed_payment_methods=plan.allowed_payment_methods,
                description=plan.description
            )
            for plan in plans
        ]
    except Exception as e:
        logger.error(f"Error fetching plans: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch plans: {str(e)}")

@router.post("/initiate-card-payment", response_model=InitiatePaymentResponse)
async def initiate_card_payment(
    request: InitiateCardPaymentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate a card payment for subscription
    
    This will return a Paystack authorization URL where the user can complete payment
    """
    try:
        # Get or create player
        player = await PlayerRepository.get_or_create_by_msisdn(
            db=db,
            msisdn=request.msisdn,
            telco="MTN"
        )
        
        # Get plan by period
        period = PlanPeriod(request.plan_period)
        plan = await SubscriptionService.get_plan_by_period(db, period)
        
        if not plan:
            raise HTTPException(status_code=404, detail=f"Plan not found for period: {request.plan_period}")
        
        # Initiate payment
        response = await SubscriptionService.initiate_card_payment(
            db=db,
            player=player,
            plan=plan,
            email=request.email
        )
        
        return InitiatePaymentResponse(
            success=response.success,
            authorization_url=response.authorization_url,
            access_code=response.access_code,
            reference=response.reference,
            message=response.message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating payment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to initiate payment: {str(e)}")

@router.post("/verify-payment", response_model=VerifyPaymentResponse)
async def verify_payment(
    request: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a payment and activate subscription
    
    This should be called after the user completes payment on Paystack
    """
    try:
        subscription = await SubscriptionService.verify_and_activate_subscription(
            db=db,
            reference=request.reference
        )
        
        return VerifyPaymentResponse(
            success=True,
            message="Subscription activated successfully",
            subscription=SubscriptionResponse(
                id=subscription.id,
                player_id=subscription.player_id,
                plan_id=subscription.plan_id,
                status=subscription.status.value,
                provider=subscription.provider.value,
                starts_at=subscription.starts_at.isoformat(),
                ends_at=subscription.ends_at.isoformat(),
                auto_renew=subscription.auto_renew
            )
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")

@router.get("/active/{msisdn}")
async def get_active_subscription(
    msisdn: str,
    db: AsyncSession = Depends(get_db)
):
    """Get active subscription for a player"""
    try:
        player = await PlayerRepository.get_by_msisdn(db, msisdn)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        subscription = await SubscriptionService.get_active_subscription(db, player.id)
        
        if not subscription:
            return {"has_active_subscription": False, "subscription": None}
        
        return {
            "has_active_subscription": True,
            "subscription": SubscriptionResponse(
                id=subscription.id,
                player_id=subscription.player_id,
                plan_id=subscription.plan_id,
                status=subscription.status.value,
                provider=subscription.provider.value,
                starts_at=subscription.starts_at.isoformat(),
                ends_at=subscription.ends_at.isoformat(),
                auto_renew=subscription.auto_renew
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscription: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch subscription: {str(e)}")
