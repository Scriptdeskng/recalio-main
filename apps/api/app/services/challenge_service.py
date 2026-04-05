from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.challenge import Challenge
from app.schemas.challenge import CreateChallengeRequest, ChallengeResponse, CreateChallengeResponse, CompleteChallengeRequest, RematchRequest
from app.services.scoring import score_answers
from app.utils.ids import new_id, new_public_id


def _topic_label(input_text: str) -> str:
    raw_label = input_text.strip()
    if not raw_label:
        return "Untitled Quiz"
    return raw_label[:37] + "…" if len(raw_label) > 40 else raw_label

async def create_challenge(db: AsyncSession, payload: CreateChallengeRequest) -> CreateChallengeResponse:
    correct_indexes = [q.correct for q in payload.questions]
    correct_answers, percentage, _ = score_answers(payload.answers, correct_indexes)
    challenge = Challenge(
        id=new_public_id("challenge"),
        public_id=new_public_id("public"),
        attempt_id=payload.attempt_id or new_id(),
        topic=_topic_label(payload.input),
        difficulty=payload.difficulty,
        question_count=payload.count,
        questions=[q.model_dump() for q in payload.questions],
        creator_name=payload.creator_name,
        creator_score=percentage,
        creator_time=payload.duration_seconds,
    )
    db.add(challenge)
    await db.commit()
    return CreateChallengeResponse(challenge_id=challenge.id, share_url=f"/challenge/{challenge.id}")

async def get_challenge(db: AsyncSession, challenge_id: str) -> ChallengeResponse | None:
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        return None
    return ChallengeResponse.model_validate(challenge, from_attributes=True)

async def get_challenges_by_ids(db: AsyncSession, ids: list[str]) -> list[ChallengeResponse]:
    result = await db.execute(select(Challenge).where(Challenge.id.in_(ids)).order_by(Challenge.created_at.desc()))
    return [ChallengeResponse.model_validate(item, from_attributes=True) for item in result.scalars().all()]

async def complete_challenge(db: AsyncSession, challenge_id: str, payload: CompleteChallengeRequest) -> ChallengeResponse | None:
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        return None
    correct_indexes = [q["correct"] for q in challenge.questions]
    _, percentage, _ = score_answers(payload.answers, correct_indexes)
    challenge.challenger_name = payload.challenger_name
    challenge.challenger_score = percentage
    challenge.challenger_time = payload.duration_seconds
    await db.commit()
    await db.refresh(challenge)
    return ChallengeResponse.model_validate(challenge, from_attributes=True)

async def create_rematch(db: AsyncSession, challenge_id: str, payload: RematchRequest) -> CreateChallengeResponse | None:
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    original = result.scalar_one_or_none()
    if not original:
        return None
    challenge = Challenge(
        id=new_public_id("challenge"),
        public_id=new_public_id("public"),
        attempt_id=original.attempt_id,
        topic=original.topic,
        difficulty=original.difficulty,
        question_count=original.question_count,
        questions=original.questions,
        creator_name=payload.creator_name,
        creator_score=payload.creator_score,
        creator_time=payload.creator_time,
    )
    db.add(challenge)
    await db.commit()
    return CreateChallengeResponse(challenge_id=challenge.id, share_url=f"/challenge/{challenge.id}")
