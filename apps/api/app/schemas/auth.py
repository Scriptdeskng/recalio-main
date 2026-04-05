from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

# Request Schemas
class SendOTPRequest(BaseModel):
    msisdn: str = Field(..., min_length=10, max_length=20)
    telco: Literal["MTN", "GLO"]

class VerifyOTPRequest(BaseModel):
    msisdn: str = Field(..., min_length=10, max_length=20)
    otp: str = Field(..., min_length=4, max_length=10)

# Response Schemas
class ActiveSubscription(BaseModel):
    subscription_id: int
    sub_status: str
    sub_active: bool
    telco: str
    traffic_source: str
    active_product_id: int
    auto_renewal: bool
    starts_date: str
    ends_date: str

class VerifyOTPData(BaseModel):
    service_id: int
    msisdn: str
    has_any_subscription: bool
    has_active_subscription: bool
    active_subscription: ActiveSubscription | None

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str
    data: VerifyOTPData

class ClientAction(BaseModel):
    action: str
    redirection_url: str

class SubscriptionStatusData(BaseModel):
    service_id: int
    msisdn: str
    has_any_subscription: bool
    has_active_subscription: bool
    active_subscription: ActiveSubscription | None
    billing_records: list = []
    client_action: ClientAction | None = None

class SubscriptionStatusResponse(BaseModel):
    success: bool
    data: SubscriptionStatusData

# Internal Player Schema
class PlayerResponse(BaseModel):
    id: int
    msisdn: str
    telco: str
    full_name: str | None = None
    has_active_subscription: bool
    subscription_data: dict | None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UpdatePlayerRequest(BaseModel):
    full_name: str | None = Field(None, max_length=120)
