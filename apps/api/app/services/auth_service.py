import httpx
import logging
import asyncio
from typing import Dict, Any
from app.schemas.auth import (
    SendOTPRequest, 
    VerifyOTPRequest, 
    VerifyOTPResponse,
    SubscriptionStatusResponse
)

logger = logging.getLogger(__name__)

INTELLIHQ_API_BASE = "https://api.intellihq.net/api/v1"

class AuthService:
    """Service for handling authentication with IntelliHQ API"""
    
    @staticmethod
    async def send_otp(request: SendOTPRequest) -> Dict[str, Any]:
        """
        Send OTP to user's phone number via IntelliHQ API
        """
        try:
            async with httpx.AsyncClient() as client:
                logger.info(f"Sending OTP to {request.msisdn} via {request.telco}")
                response = await client.post(
                    f"{INTELLIHQ_API_BASE}/service/1/auth/send-otp/",
                    json={
                        "msisdn": request.msisdn,
                        "telco": request.telco
                    },
                    timeout=30.0
                )
                logger.info(f"IntelliHQ API response status: {response.status_code}")
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            logger.error(f"Request error sending OTP: {str(e)}")
            raise
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error sending OTP: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error sending OTP: {str(e)}", exc_info=True)
            raise
    
    @staticmethod
    async def verify_otp(request: VerifyOTPRequest) -> VerifyOTPResponse:
        """
        Verify OTP code via IntelliHQ API
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{INTELLIHQ_API_BASE}/service/1/auth/verify-otp/",
                json={
                    "msisdn": request.msisdn,
                    "otp": request.otp
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return VerifyOTPResponse(**data)
    
    @staticmethod
    async def check_subscription_status(msisdn: str) -> SubscriptionStatusResponse:
        """
        Check subscription status for a given phone number with retry and exponential backoff
        """
        max_retries = 3
        base_delay = 1  # seconds
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                # Apply exponential backoff on retries
                if attempt > 0:
                    delay = base_delay * (2 ** (attempt - 1))
                    logger.info(f"Retrying after {delay}s delay...")
                    await asyncio.sleep(delay)
                
                # Increased timeout with separate connect timeout
                timeout = httpx.Timeout(30.0, connect=10.0)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    logger.info(f"Checking subscription status for {msisdn} (attempt {attempt + 1}/{max_retries})")
                    response = await client.get(
                        f"{INTELLIHQ_API_BASE}/service/1/subscription/status/",
                        params={"msisdn": msisdn},
                    )
                    logger.info(f"IntelliHQ API response status: {response.status_code}")
                    response.raise_for_status()
                    data = response.json()
                    return SubscriptionStatusResponse(**data)
                    
            except (httpx.ConnectError, httpx.ConnectTimeout) as e:
                last_exception = e
                logger.warning(f"Connection error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                if attempt == max_retries - 1:
                    logger.error(f"All {max_retries} connection attempts failed for {msisdn}")
                    raise
                continue
                logger.error(f"All {max_retries} connection attempts failed")
                raise
            except httpx.RequestError as e:
                logger.error(f"Request error checking subscription: {str(e)}")
                raise
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error checking subscription: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error checking subscription: {str(e)}", exc_info=True)
                raise
