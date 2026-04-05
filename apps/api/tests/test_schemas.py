"""Tests for Pydantic schema validation"""
import pytest
from pydantic import ValidationError
from app.schemas.quiz import QuizQuestion, GenerateQuizRequest
from app.schemas.challenge import CreateChallengeRequest, CompleteChallengeRequest
from app.schemas.session import CompleteSessionRequest

class TestQuizQuestionSchema:
    """Test QuizQuestion schema validation"""
    
    def test_valid_question(self):
        """Test valid question passes validation"""
        data = {
            "tag": "math",
            "q": "What is 2+2?",
            "choices": ["3", "4", "5", "6"],
            "correct": 1,
            "explanation": "Two plus two equals four"
        }
        question = QuizQuestion(**data)
        assert question.correct == 1
        assert len(question.choices) == 4
    
    def test_invalid_choices_count(self):
        """Test question must have exactly 4 choices"""
        data = {
            "tag": "math",
            "q": "What is 2+2?",
            "choices": ["3", "4", "5"],  # Only 3 choices
            "correct": 1,
            "explanation": "Two plus two equals four"
        }
        with pytest.raises(ValidationError):
            QuizQuestion(**data)
    
    def test_invalid_correct_index(self):
        """Test correct index must be 0-3"""
        data = {
            "tag": "math",
            "q": "What is 2+2?",
            "choices": ["3", "4", "5", "6"],
            "correct": 4,  # Out of range
            "explanation": "Two plus two equals four"
        }
        with pytest.raises(ValidationError):
            QuizQuestion(**data)
    
    def test_empty_choices(self):
        """Test choices cannot be empty strings"""
        data = {
            "tag": "math",
            "q": "What is 2+2?",
            "choices": ["3", "", "5", "6"],  # Empty choice
            "correct": 0,
            "explanation": "Two plus two equals four"
        }
        with pytest.raises(ValidationError):
            QuizQuestion(**data)
    
    def test_question_too_short(self):
        """Test question text minimum length"""
        data = {
            "tag": "math",
            "q": "Short",  # Too short
            "choices": ["A", "B", "C", "D"],
            "correct": 0,
            "explanation": "This is an explanation that is long enough"
        }
        with pytest.raises(ValidationError):
            QuizQuestion(**data)
    
    def test_explanation_too_short(self):
        """Test explanation minimum length"""
        data = {
            "tag": "math",
            "q": "What is 2+2?",
            "choices": ["3", "4", "5", "6"],
            "correct": 1,
            "explanation": "Short"  # Too short
        }
        with pytest.raises(ValidationError):
            QuizQuestion(**data)

class TestGenerateQuizRequest:
    """Test GenerateQuizRequest schema validation"""
    
    def test_valid_request(self):
        """Test valid quiz generation request"""
        data = {
            "input": "Basic math",
            "mode": "topic",
            "difficulty": "beginner",
            "count": 5
        }
        request = GenerateQuizRequest(**data)
        assert request.count == 5
        assert request.mode == "topic"
    
    def test_invalid_mode(self):
        """Test mode must be 'topic' or 'notes'"""
        data = {
            "input": "Basic math",
            "mode": "invalid_mode",
            "difficulty": "beginner",
            "count": 5
        }
        with pytest.raises(ValidationError):
            GenerateQuizRequest(**data)
    
    def test_invalid_difficulty(self):
        """Test difficulty must be valid literal"""
        data = {
            "input": "Basic math",
            "mode": "topic",
            "difficulty": "expert",  # Invalid
            "count": 5
        }
        with pytest.raises(ValidationError):
            GenerateQuizRequest(**data)
    
    def test_count_too_low(self):
        """Test count must be at least 1"""
        data = {
            "input": "Basic math",
            "mode": "topic",
            "difficulty": "beginner",
            "count": 0
        }
        with pytest.raises(ValidationError):
            GenerateQuizRequest(**data)
    
    def test_count_too_high(self):
        """Test count cannot exceed 20"""
        data = {
            "input": "Basic math",
            "mode": "topic",
            "difficulty": "beginner",
            "count": 21
        }
        with pytest.raises(ValidationError):
            GenerateQuizRequest(**data)
    
    def test_empty_input(self):
        """Test input cannot be empty"""
        data = {
            "input": "",
            "mode": "topic",
            "difficulty": "beginner",
            "count": 5
        }
        with pytest.raises(ValidationError):
            GenerateQuizRequest(**data)

class TestCreateChallengeRequest:
    """Test CreateChallengeRequest schema validation"""
    
    def test_valid_request(self, sample_quiz_questions):
        """Test valid challenge creation request"""
        data = {
            "attempt_id": None,
            "creator_name": "John",
            "input": "Math quiz",
            "difficulty": "intermediate",
            "count": 2,
            "questions": sample_quiz_questions,
            "answers": [0, 0],
            "duration_seconds": 120
        }
        request = CreateChallengeRequest(**data)
        assert request.creator_name == "John"
        assert len(request.questions) == 2
    
    def test_creator_name_too_long(self, sample_quiz_questions):
        """Test creator name length limit"""
        data = {
            "creator_name": "A" * 121,  # Too long
            "input": "Math quiz",
            "difficulty": "intermediate",
            "count": 2,
            "questions": sample_quiz_questions,
            "answers": [0, 0],
            "duration_seconds": 120
        }
        with pytest.raises(ValidationError):
            CreateChallengeRequest(**data)
    
    def test_negative_duration(self, sample_quiz_questions):
        """Test duration cannot be negative"""
        data = {
            "creator_name": "John",
            "input": "Math quiz",
            "difficulty": "intermediate",
            "count": 2,
            "questions": sample_quiz_questions,
            "answers": [0, 0],
            "duration_seconds": -10
        }
        with pytest.raises(ValidationError):
            CreateChallengeRequest(**data)

class TestCompleteSessionRequest:
    """Test CompleteSessionRequest schema validation"""
    
    def test_valid_request(self, sample_quiz_questions):
        """Test valid session completion request"""
        data = {
            "input": "Math problems",
            "mode": "topic",
            "difficulty": "beginner",
            "count": 2,
            "answers": [0, 1],
            "duration_seconds": 60,
            "player_name": "Alice",
            "questions": sample_quiz_questions
        }
        request = CompleteSessionRequest(**data)
        assert request.player_name == "Alice"
        assert len(request.answers) == 2
    
    def test_player_name_optional(self, sample_quiz_questions):
        """Test player name is optional"""
        data = {
            "input": "Math problems",
            "mode": "topic",
            "difficulty": "beginner",
            "count": 2,
            "answers": [0, 1],
            "duration_seconds": 60,
            "questions": sample_quiz_questions
        }
        request = CompleteSessionRequest(**data)
        assert request.player_name is None
