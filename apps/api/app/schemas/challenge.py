from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal
from app.schemas.quiz import QuizQuestion

class CreateChallengeRequest(BaseModel):
    attempt_id: str | None = None
    creator_name: str = Field(..., min_length=1, max_length=120)
    input: str = Field(..., min_length=1, max_length=10000)
    difficulty: Literal["beginner", "intermediate", "advanced"]
    count: int = Field(..., ge=1, le=20)
    questions: list[QuizQuestion]
    answers: list[int] = Field(..., description="Creator's answers")
    duration_seconds: int = Field(..., ge=0)

class ChallengeQueryRequest(BaseModel):
    ids: list[str] = Field(..., max_length=100)

class CompleteChallengeRequest(BaseModel):
    challenger_name: str = Field(..., min_length=1, max_length=120)
    answers: list[int]
    duration_seconds: int = Field(..., ge=0)

class RematchRequest(BaseModel):
    creator_name: str = Field(..., min_length=1, max_length=120)
    creator_score: int = Field(..., ge=0, le=100)
    creator_time: int = Field(..., ge=0)

class ChallengeResponse(BaseModel):
    id: str
    topic: str
    difficulty: str
    question_count: int
    questions: list[QuizQuestion]
    creator_name: str
    creator_score: int
    creator_time: int
    challenger_name: str | None = None
    challenger_score: int | None = None
    challenger_time: int | None = None
    created_at: datetime
    expires_at: datetime

class CreateChallengeResponse(BaseModel):
    challenge_id: str
    share_url: str
