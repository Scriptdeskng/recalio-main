from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, Any
from datetime import datetime

# ============= IntelliHQ Webhook Schemas =============

class IntelliHQProduct(BaseModel):
    id: str
    name: str
    identity: str
    type: str
    subscription_type: str
    status: str

class IntelliHQDetails(BaseModel):
    phone: str
    amount: float
    channel: str
    date: str
    expiry: str
    auto_renewal: bool
    telco_status_code: str
    telco_ref: str
    sequence_no: Optional[str] = None
    bearerId: Optional[str] = None

class IntelliHQWebhookPayload(BaseModel):
    type: Literal["RENEWAL_NOTIFICATION", "SYNC_NOTIFICATION", "UNSUBSCRIPTION_NOTIFICATION"]
    telco: str
    action: str
    shortcode: Optional[str] = None
    product: IntelliHQProduct
    details: IntelliHQDetails

# ============= Paystack Webhook Schemas =============

class PaystackCustomer(BaseModel):
    id: int
    customer_code: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class PaystackAuthorization(BaseModel):
    authorization_code: str
    bin: Optional[str] = None
    last4: Optional[str] = None
    exp_month: Optional[str] = None
    exp_year: Optional[str] = None
    channel: Optional[str] = None
    card_type: Optional[str] = None
    bank: Optional[str] = None
    country_code: Optional[str] = None
    brand: Optional[str] = None
    reusable: Optional[bool] = None
    signature: Optional[str] = None

class PaystackTransactionData(BaseModel):
    id: int
    domain: str
    status: str
    reference: str
    amount: int
    message: Optional[str] = None
    gateway_response: str
    paid_at: Optional[str] = None
    created_at: str
    channel: str
    currency: str
    ip_address: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    fees: Optional[int] = None
    customer: PaystackCustomer
    authorization: PaystackAuthorization

class PaystackWebhookPayload(BaseModel):
    event: str
    data: PaystackTransactionData

# ============= Response Schemas =============

class WebhookResponse(BaseModel):
    success: bool
    message: str
    subscription_id: Optional[int] = None
