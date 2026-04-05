from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    msisdn: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    telco: Mapped[str] = mapped_column(String(10), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    service_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    has_any_subscription: Mapped[bool] = mapped_column(Boolean, default=False)
    has_active_subscription: Mapped[bool] = mapped_column(Boolean, default=False)
    subscription_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_subscription_check: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
