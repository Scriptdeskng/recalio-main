from datetime import datetime, timedelta, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

def utc_now():
    return datetime.now(timezone.utc)

def expires_default():
    return datetime.now(timezone.utc) + timedelta(days=7)

class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    public_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    questions: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    creator_name: Mapped[str] = mapped_column(String(120), nullable=False)
    creator_score: Mapped[int] = mapped_column(Integer, nullable=False)
    creator_time: Mapped[int] = mapped_column(Integer, nullable=False)
    challenger_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    challenger_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    challenger_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=expires_default)
