from pydantic import BaseModel, Field
from typing import Literal
from app.schemas.quiz import QuizQuestion

class CompleteSessionRequest(BaseModel):
    input: str = Field(..., min_length=1, max_length=10000)
    mode: Literal["topic", "notes"]
    difficulty: Literal["beginner", "intermediate", "advanced"]
    count: int = Field(..., ge=1, le=20)
    answers: list[int] = Field(..., description="Selected answer indices")
    duration_seconds: int = Field(..., ge=0, description="Time taken in seconds")
    player_name: str | None = Field(None, max_length=120)
    questions: list[QuizQuestion]

class CompleteSessionResponse(BaseModel):
    attempt_id: str
    correct_answers: int = Field(..., ge=0)
    total_questions: int = Field(..., ge=1)
    score_percent: int = Field(..., ge=0, le=100)
    xp_earned: int = Field(..., ge=0)
