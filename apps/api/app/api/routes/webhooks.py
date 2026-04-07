import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.webhook import IntelliHQWebhookPayload, PaystackWebhookPayload, WebhookResponse
from app.services.webhook_service import WebhookService
from app.services.paystack_webhook_service import PaystackWebhookService
from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/intellihq", response_model=WebhookResponse)
async def handle_intellihq_webhook(
    payload: IntelliHQWebhookPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle IntelliHQ webhook notifications
    
    Processes three types of notifications:
    - RENEWAL_NOTIFICATION: Updates subscription expiry date
    - SYNC_NOTIFICATION: Creates new subscription
    - UNSUBSCRIPTION_NOTIFICATION: Cancels subscription
    """
    try:
        logger.info(f"Received IntelliHQ webhook: type={payload.type}, phone={payload.details.phone}")
        
        # Process webhook
        subscription = await WebhookService.process_webhook(db, payload)
        
        return WebhookResponse(
            success=True,
            message=f"{payload.type} processed successfully",
            subscription_id=subscription.id
        )
    
    except ValueError as e:
        logger.error(f"Validation error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process webhook: {str(e)}"
        )

@router.post("/paystack", response_model=WebhookResponse)
async def handle_paystack_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_paystack_signature: str = Header(None)
):
    """
    Handle Paystack webhook notifications
    
    Processes events:
    - charge.success: Successful charge (including recurring charges)
    - invoice.update: Invoice update (subscription payment)
    - invoice.payment_failed: Failed subscription payment
    """
    try:
        # Get raw body for signature verification
        raw_body = await request.body()
        
        # Verify signature
        if not PaystackWebhookService.verify_signature(raw_body, x_paystack_signature):
            logger.warning("Invalid Paystack webhook signature")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
        
        # Parse payload
        import json
        payload_dict = json.loads(raw_body)
        payload = PaystackWebhookPayload(**payload_dict)
        
        logger.info(f"Received Paystack webhook: event={payload.event}, reference={payload.data.reference}")
        
        # Process webhook
        subscription = await PaystackWebhookService.process_webhook(db, payload)
        
        # Return success even if subscription is None (unhandled event type)
        return WebhookResponse(
            success=True,
            message=f"{payload.event} processed successfully",
            subscription_id=subscription.id if subscription else None
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 401)
        raise
    
    except ValueError as e:
        logger.error(f"Validation error processing Paystack webhook: {str(e)}")
        # Return 200 OK even for validation errors to prevent retries
        return WebhookResponse(
            success=False,
            message=str(e)
        )
    
    except Exception as e:
        logger.error(f"Error processing Paystack webhook: {str(e)}", exc_info=True)
        # Return 200 OK to prevent retries for unhandled errors
        return WebhookResponse(
            success=False,
            message=f"Failed to process webhook: {str(e)}"
        )
