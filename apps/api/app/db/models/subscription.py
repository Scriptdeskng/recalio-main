from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import enum

def utc_now():
    return datetime.now(timezone.utc)

class SubscriptionStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    GRACE = "grace"
    SUSPENDED = "suspended"
    CHURNED = "churned"
    CANCELLED = "cancelled"

class PaymentProvider(str, enum.Enum):
    INTELLIHQ = "intellihq"  # For airtime
    PAYSTACK = "paystack"    # For card

class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    
    status: Mapped[SubscriptionStatus] = mapped_column(SQLEnum(SubscriptionStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    provider: Mapped[PaymentProvider] = mapped_column(SQLEnum(PaymentProvider, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Payment details
    payment_reference: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    authorization_code: Mapped[str | None] = mapped_column(String(255), nullable=True)  # For recurring card charges
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # IntelliHQ specific
    intellihq_subscription_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    
    # Subscription period
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    next_billing_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Auto-renewal
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Payment metadata (mapped to 'metadata' column in DB, but 'metadata' is reserved in SQLAlchemy)
    payment_data: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
