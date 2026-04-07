from pydantic import BaseModel, EmailStr, Field
from typing import Literal

# Request schemas
class InitiateCardPaymentRequest(BaseModel):
    msisdn: str = Field(..., min_length=10, max_length=20, description="Player's phone number")
    email: EmailStr = Field(..., description="Customer's email")
    plan_period: Literal["daily", "weekly", "monthly"] = Field(..., description="Subscription plan period")

class VerifyPaymentRequest(BaseModel):
    reference: str = Field(..., description="Payment reference")

# Response schemas
class SubscriptionPlanResponse(BaseModel):
    id: int
    name: str
    period: str
    price: int
    allowed_payment_methods: str
    description: str | None
    
    class Config:
        from_attributes = True

class InitiatePaymentResponse(BaseModel):
    success: bool
    authorization_url: str | None = None
    access_code: str | None = None
    reference: str | None = None
    message: str | None = None

class SubscriptionResponse(BaseModel):
    id: int
    player_id: int
    plan_id: int
    status: str
    provider: str
    starts_at: str
    ends_at: str
    auto_renew: bool
    
    class Config:
        from_attributes = True

class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    subscription: SubscriptionResponse | None = None
