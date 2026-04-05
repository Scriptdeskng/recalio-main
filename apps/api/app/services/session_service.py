from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.session import CompleteSessionRequest, CompleteSessionResponse
from app.db.models.quiz_attempt import QuizAttempt
from app.db.models.quiz_attempt_question import QuizAttemptQuestion
from app.db.models.quiz_attempt_answer import QuizAttemptAnswer
from app.db.models.player import Player
from app.services.scoring import score_answers
from app.utils.ids import new_id

async def complete_session(db: AsyncSession, payload: CompleteSessionRequest) -> CompleteSessionResponse:
    correct_indexes = [q.correct for q in payload.questions]
    correct_answers, percentage, xp = score_answers(payload.answers, correct_indexes)

    # Get player_id if player_msisdn is provided
    player_id = None
    if payload.player_msisdn:
        result = await db.execute(select(Player).where(Player.msisdn == payload.player_msisdn))
        player = result.scalar_one_or_none()
        if player:
            player_id = player.id

    attempt = QuizAttempt(
        id=new_id(),
        player_id=player_id,
        player_name=payload.player_name,
        input_text=payload.input,
        input_mode=payload.mode,
        difficulty=payload.difficulty,
        question_count=payload.count,
        correct_answers=correct_answers,
        score_percent=percentage,
        xp_earned=xp,
        duration_seconds=payload.duration_seconds,
    )
    db.add(attempt)

    for idx, question in enumerate(payload.questions):
        db.add(QuizAttemptQuestion(
            id=new_id(), attempt_id=attempt.id, position=idx, tag=question.tag, prompt=question.q,
            choices=question.choices, correct_index=question.correct, explanation=question.explanation,
        ))
        selected = payload.answers[idx] if idx < len(payload.answers) else -1
        db.add(QuizAttemptAnswer(
            id=new_id(), attempt_id=attempt.id, question_position=idx, selected_index=selected,
            is_correct=selected == question.correct,
        ))

    await db.commit()
    return CompleteSessionResponse(
        attempt_id=attempt.id,
        correct_answers=correct_answers,
        total_questions=payload.count,
        score_percent=percentage,
        xp_earned=xp,
    )
