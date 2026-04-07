import httpx
import logging
from typing import Dict, Any
from datetime import datetime
from app.services.payment.base import (
    PaymentProvider,
    PaymentTransaction,
    InitiatePaymentResponse
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class PaystackProvider(PaymentProvider):
    """Paystack payment provider implementation"""
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json"
        }
    
    async def initialize_transaction(
        self,
        email: str,
        amount: int,
        plan_code: str | None = None,
        metadata: Dict[str, Any] | None = None
    ) -> InitiatePaymentResponse:
        """Initialize a Paystack transaction"""
        try:
            payload = {
                "email": email,
                "amount": amount,
                "currency": "NGN",
                "metadata": metadata or {}
            }
            
            # If plan_code is provided, this is a subscription
            if plan_code:
                payload["plan"] = plan_code
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/transaction/initialize",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("status"):
                    return InitiatePaymentResponse(
                        success=True,
                        authorization_url=data["data"]["authorization_url"],
                        access_code=data["data"]["access_code"],
                        reference=data["data"]["reference"]
                    )
                else:
                    return InitiatePaymentResponse(
                        success=False,
                        message=data.get("message", "Failed to initialize transaction")
                    )
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"Paystack HTTP error: {e.response.status_code} - {e.response.text}")
            return InitiatePaymentResponse(
                success=False,
                message=f"Payment service error: {e.response.status_code}"
            )
        except Exception as e:
            logger.error(f"Paystack initialization error: {str(e)}", exc_info=True)
            return InitiatePaymentResponse(
                success=False,
                message=f"Failed to initialize payment: {str(e)}"
            )
    
    async def verify_transaction(self, reference: str) -> PaymentTransaction:
        """Verify a Paystack transaction"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/transaction/verify/{reference}",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                if not data.get("status"):
                    raise Exception(data.get("message", "Verification failed"))
                
                tx_data = data["data"]
                
                # Extract paid_at if available
                paid_at = None
                if tx_data.get("paid_at"):
                    try:
                        paid_at = datetime.fromisoformat(tx_data["paid_at"].replace("Z", "+00:00"))
                    except:
                        pass
                
                # Extract authorization code if available
                authorization_code = None
                if tx_data.get("authorization") and tx_data["authorization"].get("authorization_code"):
                    authorization_code = tx_data["authorization"]["authorization_code"]
                
                return PaymentTransaction(
                    reference=tx_data["reference"],
                    amount=tx_data["amount"],
                    email=tx_data["customer"]["email"],
                    status=tx_data["status"],
                    paid_at=paid_at,
                    authorization_code=authorization_code,
                    channel=tx_data.get("channel"),
                    metadata=tx_data.get("metadata")
                )
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Paystack verify HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to verify transaction: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Paystack verification error: {str(e)}", exc_info=True)
            raise
    
    async def charge_authorization(
        self,
        authorization_code: str,
        email: str,
        amount: int,
        metadata: Dict[str, Any] | None = None
    ) -> PaymentTransaction:
        """Charge a previously authorized card"""
        try:
            payload = {
                "authorization_code": authorization_code,
                "email": email,
                "amount": amount,
                "currency": "NGN",
                "metadata": metadata or {}
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/transaction/charge_authorization",
                    headers=self.headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                if not data.get("status"):
                    raise Exception(data.get("message", "Charge failed"))
                
                tx_data = data["data"]
                
                # Extract paid_at if available
                paid_at = None
                if tx_data.get("paid_at"):
                    try:
                        paid_at = datetime.fromisoformat(tx_data["paid_at"].replace("Z", "+00:00"))
                    except:
                        pass
                
                return PaymentTransaction(
                    reference=tx_data["reference"],
                    amount=tx_data["amount"],
                    email=tx_data["customer"]["email"],
                    status=tx_data["status"],
                    paid_at=paid_at,
                    authorization_code=authorization_code,
                    channel=tx_data.get("channel"),
                    metadata=tx_data.get("metadata")
                )
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Paystack charge HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to charge authorization: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Paystack charge error: {str(e)}", exc_info=True)
            raise


# Factory function to get payment provider
def get_paystack_provider() -> PaystackProvider:
    """Get configured Paystack provider instance"""
    if not settings.PAYSTACK_SECRET_KEY:
        raise ValueError("PAYSTACK_SECRET_KEY not configured")
    return PaystackProvider(settings.PAYSTACK_SECRET_KEY)
