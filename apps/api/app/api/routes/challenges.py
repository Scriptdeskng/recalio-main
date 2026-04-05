from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.challenge import CreateChallengeRequest, CreateChallengeResponse, ChallengeQueryRequest, CompleteChallengeRequest, RematchRequest, ChallengeResponse
from app.services.challenge_service import create_challenge, get_challenge, get_challenges_by_ids, complete_challenge, create_rematch

router = APIRouter(prefix="/api/v1/challenges", tags=["challenges"])

@router.post("", response_model=CreateChallengeResponse)
async def create_challenge_route(payload: CreateChallengeRequest, db: AsyncSession = Depends(get_db)):
    return await create_challenge(db, payload)

@router.post("/query", response_model=list[ChallengeResponse])
async def query_challenges(payload: ChallengeQueryRequest, db: AsyncSession = Depends(get_db)):
    return await get_challenges_by_ids(db, payload.ids)

@router.get("/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge_route(challenge_id: str, db: AsyncSession = Depends(get_db)):
    challenge = await get_challenge(db, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@router.post("/{challenge_id}/complete", response_model=ChallengeResponse)
async def complete_challenge_route(challenge_id: str, payload: CompleteChallengeRequest, db: AsyncSession = Depends(get_db)):
    challenge = await complete_challenge(db, challenge_id, payload)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@router.post("/{challenge_id}/rematch", response_model=CreateChallengeResponse)
async def create_rematch_route(challenge_id: str, payload: RematchRequest, db: AsyncSession = Depends(get_db)):
    challenge = await create_rematch(db, challenge_id, payload)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge
