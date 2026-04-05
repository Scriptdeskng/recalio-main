from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.session import CompleteSessionRequest, CompleteSessionResponse
from app.services.session_service import complete_session

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])

@router.post("/complete", response_model=CompleteSessionResponse)
async def complete_session_route(payload: CompleteSessionRequest, db: AsyncSession = Depends(get_db)):
    return await complete_session(db, payload)
