from fastapi import APIRouter, HTTPException
from app.schemas.quiz import GenerateQuizRequest, GenerateQuizResponse
from app.services.ai_quiz_service import AIQuizService
from app.core.exceptions import QuizGenerationError, AIResponseError
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/quizzes", tags=["quizzes"])

@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(payload: GenerateQuizRequest):
    try:
        service = AIQuizService()
        questions = await service.generate_quiz(
            input_text=payload.input,
            mode=payload.mode,
            difficulty=payload.difficulty,
            count=payload.count
        )
        return GenerateQuizResponse(questions=questions)
    except (QuizGenerationError, AIResponseError) as e:
        logger.error(f"Quiz generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred generating the quiz")
