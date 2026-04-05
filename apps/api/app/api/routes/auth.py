from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import (
    SendOTPRequest,
    VerifyOTPRequest,
    VerifyOTPResponse,
    SubscriptionStatusResponse,
    PlayerResponse,
    UpdatePlayerRequest
)
from app.services.auth_service import AuthService
from app.repositories.player_repository import PlayerRepository
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    """
    Send OTP to user's phone number
    """
    try:
        result = await AuthService.send_otp(request)
        return result
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error in send_otp: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"API error: {e.response.text if e.response.text else str(e)}"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error in send_otp: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"Service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in send_otp: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify OTP and create/update player profile
    """
    try:
        # Verify OTP with IntelliHQ
        result = await AuthService.verify_otp(request)
        
        # Create or update player profile
        player = await PlayerRepository.create_or_update_from_auth(
            db=db,
            msisdn=request.msisdn,
            telco=result.data.telco if hasattr(result.data, 'telco') else "MTN",
            auth_data=result.data
        )
        
        return result
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify OTP: {str(e)}")

@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def check_subscription_status(msisdn: str, db: AsyncSession = Depends(get_db)):
    """
    Check subscription status for a phone number
    """
    try:
        # Get subscription status from IntelliHQ
        result = await AuthService.check_subscription_status(msisdn)
        
        # Update player subscription status in database
        await PlayerRepository.update_subscription_status(
            db=db,
            msisdn=msisdn,
            subscription_data=result.data.model_dump()
        )
        
        return result
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error in check_subscription_status: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"API error: {e.response.text if e.response.text else str(e)}"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error in check_subscription_status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"Service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in check_subscription_status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to check subscription status: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check subscription status: {str(e)}")

@router.get("/player/{msisdn}", response_model=PlayerResponse)
async def get_player(msisdn: str, db: AsyncSession = Depends(get_db)):
    """
    Get player profile by phone number
    """
    player = await PlayerRepository.get_by_msisdn(db, msisdn)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.patch("/player/{msisdn}", response_model=PlayerResponse)
async def update_player(msisdn: str, request: UpdatePlayerRequest, db: AsyncSession = Depends(get_db)):
    """
    Update player profile
    """
    player = await PlayerRepository.update_player(
        db=db,
        msisdn=msisdn,
        full_name=request.full_name
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player
