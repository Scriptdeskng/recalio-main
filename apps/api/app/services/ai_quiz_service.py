import json
import re
import httpx
import logging
from app.core.config import settings
from app.core.exceptions import AIResponseError, QuizGenerationError
from app.services.prompt_builder import build_quiz_prompt
from app.services.question_validator import validate_questions

logger = logging.getLogger(__name__)

class AIQuizService:
    async def generate_quiz(self, *, input_text: str, mode: str, difficulty: str, count: int):
        """
        Generate quiz questions using AI.
        
        Raises:
            QuizGenerationError: If API call fails
            AIResponseError: If response cannot be parsed
        """
        try:
            prompt = build_quiz_prompt(input_text=input_text, mode=mode, difficulty=difficulty, count=count)
            headers = {
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            payload = {
                "model": settings.ANTHROPIC_MODEL,
                "max_tokens": 4000,
                "messages": [{"role": "user", "content": prompt}],
            }
            
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Anthropic API error: {e.response.status_code} - {e.response.text}")
            raise QuizGenerationError(f"AI service returned error: {e.response.status_code}") from e
        except httpx.TimeoutException as e:
            logger.error("Anthropic API timeout")
            raise QuizGenerationError("AI service timed out") from e
        except httpx.RequestError as e:
            logger.error(f"Request error: {str(e)}")
            raise QuizGenerationError("Failed to connect to AI service") from e
        
        try:
            text = "".join(
                block.get("text", "")
                for block in data.get("content", [])
                if block.get("type") == "text"
            )
            
            if not text.strip():
                raise AIResponseError("AI returned empty response")
            
            match = re.search(r"\[.*\]", text, re.DOTALL)
            if not match:
                logger.error(f"Could not extract JSON from AI response: {text[:200]}")
                raise AIResponseError("Could not extract question JSON from AI response")
            
            parsed = json.loads(match.group(0))
            
            if not isinstance(parsed, list):
                raise AIResponseError("AI response is not a list of questions")
            
            questions = validate_questions(parsed)
            
            if len(questions) != count:
                logger.warning(f"AI returned {len(questions)} questions, expected {count}")
                raise AIResponseError(f"AI returned {len(questions)} questions, expected {count}")
            
            return questions
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from AI response: {str(e)}")
            raise AIResponseError("AI response contained invalid JSON") from e
        except Exception as e:
            if isinstance(e, (AIResponseError, QuizGenerationError)):
                raise
            logger.error(f"Unexpected error parsing AI response: {str(e)}")
            raise AIResponseError(f"Failed to process AI response: {str(e)}") from e
