"""Tests for quiz generation API routes"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import status
from fastapi.testclient import TestClient
from app.main import app
from app.core.exceptions import AIResponseError, QuizGenerationError

client = TestClient(app)

class TestQuizRoutes:
    """Test quiz generation endpoints"""
    
    def test_generate_quiz_success(self, sample_quiz_questions):
        """Test successful quiz generation"""
        with patch('app.api.routes.quizzes.AIQuizService') as mock_service_class:
            mock_service = mock_service_class.return_value
            mock_service.generate_quiz = AsyncMock(return_value=sample_quiz_questions)
            
            response = client.post(
                "/api/v1/quizzes/generate",
                json={
                    "input": "Science basics",
                    "mode": "topic",
                    "difficulty": "beginner",
                    "count": 2
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "questions" in data
            assert len(data["questions"]) == 2
    
    def test_generate_quiz_invalid_mode(self):
        """Test quiz generation with invalid mode"""
        response = client.post(
            "/api/v1/quizzes/generate",
            json={
                "input": "Science basics",
                "mode": "invalid_mode",
                "difficulty": "beginner",
                "count": 2
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_quiz_invalid_difficulty(self):
        """Test quiz generation with invalid difficulty"""
        response = client.post(
            "/api/v1/quizzes/generate",
            json={
                "input": "Science basics",
                "mode": "topic",
                "difficulty": "expert",
                "count": 2
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_quiz_count_too_high(self):
        """Test quiz generation with count exceeding limit"""
        response = client.post(
            "/api/v1/quizzes/generate",
            json={
                "input": "Science basics",
                "mode": "topic",
                "difficulty": "beginner",
                "count": 21
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_quiz_empty_input(self):
        """Test quiz generation with empty input"""
        response = client.post(
            "/api/v1/quizzes/generate",
            json={
                "input": "",
                "mode": "topic",
                "difficulty": "beginner",
                "count": 5
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_quiz_ai_error(self):
        """Test handling of AI service errors"""
        with patch('app.api.routes.quizzes.AIQuizService') as mock_service_class:
            mock_service = mock_service_class.return_value
            mock_service.generate_quiz = AsyncMock(
                side_effect=AIResponseError("AI service unavailable")
            )
            
            response = client.post(
                "/api/v1/quizzes/generate",
                json={
                    "input": "Science basics",
                    "mode": "topic",
                    "difficulty": "beginner",
                    "count": 2
                }
            )
            
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            assert "AI service unavailable" in response.json()["detail"]
    
    def test_generate_quiz_validation_error(self):
        """Test handling of quiz validation errors"""
        with patch('app.api.routes.quizzes.AIQuizService') as mock_service_class:
            mock_service = mock_service_class.return_value
            mock_service.generate_quiz = AsyncMock(
                side_effect=QuizGenerationError("Invalid quiz format")
            )
            
            response = client.post(
                "/api/v1/quizzes/generate",
                json={
                    "input": "Science basics",
                    "mode": "topic",
                    "difficulty": "beginner",
                    "count": 2
                }
            )
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "Invalid quiz format" in response.json()["detail"]
    
    def test_generate_quiz_missing_fields(self):
        """Test quiz generation with missing required fields"""
        response = client.post(
            "/api/v1/quizzes/generate",
            json={
                "input": "Science basics",
                "mode": "topic"
                # Missing difficulty and count
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_generate_quiz_notes_mode(self, sample_quiz_questions):
        """Test quiz generation with notes mode"""
        with patch('app.api.routes.quizzes.AIQuizService') as mock_service_class:
            mock_service = mock_service_class.return_value
            mock_service.generate_quiz = AsyncMock(return_value=sample_quiz_questions)
            
            response = client.post(
                "/api/v1/quizzes/generate",
                json={
                    "input": "Plants perform photosynthesis to convert light into energy",
                    "mode": "notes",
                    "difficulty": "intermediate",
                    "count": 2
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert len(data["questions"]) == 2
    
    def test_generate_quiz_advanced_difficulty(self, sample_quiz_questions):
        """Test quiz generation with advanced difficulty"""
        with patch('app.api.routes.quizzes.AIQuizService') as mock_service_class:
            mock_service = mock_service_class.return_value
            mock_service.generate_quiz = AsyncMock(return_value=sample_quiz_questions)
            
            response = client.post(
                "/api/v1/quizzes/generate",
                json={
                    "input": "Quantum mechanics",
                    "mode": "topic",
                    "difficulty": "advanced",
                    "count": 5
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
