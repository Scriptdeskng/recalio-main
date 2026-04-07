from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, Numeric, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import enum

def utc_now():
    return datetime.now(timezone.utc)

class PlanPeriod(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class PaymentMethod(str, enum.Enum):
    AIRTIME = "airtime"
    CARD = "card"

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    period: Mapped[PlanPeriod] = mapped_column(SQLEnum(PlanPeriod, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # Price in kobo/cents
    allowed_payment_methods: Mapped[str] = mapped_column(String(50), nullable=False)  # Comma-separated: "airtime,card"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    def has_payment_method(self, method: PaymentMethod) -> bool:
        """Check if this plan supports the given payment method"""
        methods = self.allowed_payment_methods.split(",")
        return method.value in methods
