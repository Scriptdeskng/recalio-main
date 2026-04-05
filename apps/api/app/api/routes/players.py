from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.db.models.quiz_attempt import QuizAttempt
from app.db.models.challenge import Challenge
from app.db.models.player import Player
from typing import List
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/players", tags=["players"])

class QuizAttemptResponse(BaseModel):
    id: str
    input_text: str
    difficulty: str
    question_count: int
    correct_answers: int
    score_percent: int
    xp_earned: int
    duration_seconds: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PlayerChallengeResponse(BaseModel):
    id: str
    topic: str
    difficulty: str
    question_count: int
    creator_name: str
    creator_score: int
    creator_time: int
    challenger_name: str | None
    challenger_score: int | None
    challenger_time: int | None
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/{msisdn}/quizzes", response_model=List[QuizAttemptResponse])
async def get_player_quizzes(msisdn: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get quiz attempts for a player"""
    # Get player
    result = await db.execute(select(Player).where(Player.msisdn == msisdn))
    player = result.scalar_one_or_none()
    
    if not player:
        return []
    
    # Get quiz attempts
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.player_id == player.id)
        .order_by(desc(QuizAttempt.created_at))
        .limit(limit)
    )
    attempts = result.scalars().all()
    
    return [QuizAttemptResponse.model_validate(attempt, from_attributes=True) for attempt in attempts]

@router.get("/{msisdn}/challenges", response_model=List[PlayerChallengeResponse])
async def get_player_challenges(msisdn: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get challenges created by a player"""
    # Get player
    result = await db.execute(select(Player).where(Player.msisdn == msisdn))
    player = result.scalar_one_or_none()
    
    if not player:
        return []
    
    # Get challenges
    result = await db.execute(
        select(Challenge)
        .where(Challenge.player_id == player.id)
        .order_by(desc(Challenge.created_at))
        .limit(limit)
    )
    challenges = result.scalars().all()
    
    return [PlayerChallengeResponse.model_validate(challenge, from_attributes=True) for challenge in challenges]
