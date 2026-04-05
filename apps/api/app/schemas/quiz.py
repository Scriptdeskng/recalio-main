from pydantic import BaseModel, Field, model_validator
from typing import Literal

class QuizQuestion(BaseModel):
    tag: str = Field(..., min_length=1, max_length=50)
    q: str = Field(..., min_length=10, max_length=500, description="Question text")
    choices: list[str] = Field(..., min_length=4, max_length=4)
    correct: int = Field(..., ge=0, le=3, description="Zero-based index of correct answer")
    explanation: str = Field(..., min_length=10, max_length=1000)

    @model_validator(mode="after")
    def validate_question(self):
        if len(self.choices) != 4:
            raise ValueError("Each question must have exactly 4 choices")
        if self.correct < 0 or self.correct > 3:
            raise ValueError("Correct answer must be between 0 and 3")
        if not all(choice.strip() for choice in self.choices):
            raise ValueError("All choices must be non-empty")
        return self

class GenerateQuizRequest(BaseModel):
    input: str = Field(..., min_length=1, max_length=10000, description="Topic or notes")
    mode: Literal["topic", "notes"] = Field(..., description="Generation mode")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(..., description="Question difficulty")
    count: int = Field(..., ge=1, le=20, description="Number of questions to generate")

class GenerateQuizResponse(BaseModel):
    questions: list[QuizQuestion]
