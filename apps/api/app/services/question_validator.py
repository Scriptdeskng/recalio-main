from app.schemas.quiz import QuizQuestion

def validate_questions(raw_questions: list[dict]) -> list[QuizQuestion]:
    return [QuizQuestion.model_validate(item) for item in raw_questions]
