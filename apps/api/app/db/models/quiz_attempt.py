from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    player_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("players.id", ondelete="SET NULL"), nullable=True, index=True)
    player_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    input_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    score_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
