"""Tests for session API routes"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import status
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestSessionRoutes:
    """Test session completion endpoints"""
    
    def test_complete_session_success(self, sample_quiz_questions):
        """Test successful session completion"""
        with patch('app.api.routes.sessions.get_db') as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_db
            
            mock_db.add = MagicMock()
            mock_db.commit = AsyncMock()
            mock_db.refresh = AsyncMock()
            
            response = client.post(
                "/api/v1/sessions/complete",
                json={
                    "input": "Math basics",
                    "mode": "topic",
                    "difficulty": "beginner",
                    "count": 2,
                    "answers": [0, 1],
                    "duration_seconds": 120,
                    "player_name": "Alice",
                    "questions": sample_quiz_questions
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "id" in data
            assert "score_percentage" in data
            assert "xp_earned" in data
    
    def test_complete_session_without_player_name(self, sample_quiz_questions):
        """Test session completion without player name"""
        with patch('app.api.routes.sessions.get_db') as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_db
            
            mock_db.add = MagicMock()
            mock_db.commit = AsyncMock()
            mock_db.refresh = AsyncMock()
            
            response = client.post(
                "/api/v1/sessions/complete",
                json={
                    "input": "Math basics",
                    "mode": "topic",
                    "difficulty": "beginner",
                    "count": 2,
                    "answers": [0, 1],
                    "duration_seconds": 120,
                    "questions": sample_quiz_questions
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
    
    def test_complete_session_invalid_mode(self, sample_quiz_questions):
        """Test session completion with invalid mode"""
        response = client.post(
            "/api/v1/sessions/complete",
            json={
                "input": "Math basics",
                "mode": "invalid_mode",
                "difficulty": "beginner",
                "count": 2,
                "answers": [0, 1],
                "duration_seconds": 120,
                "questions": sample_quiz_questions
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_complete_session_missing_answers(self, sample_quiz_questions):
        """Test session completion without answers"""
        response = client.post(
            "/api/v1/sessions/complete",
            json={
                "input": "Math basics",
                "mode": "topic",
                "difficulty": "beginner",
                "count": 2,
                "duration_seconds": 120,
                "questions": sample_quiz_questions
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_complete_session_negative_duration(self, sample_quiz_questions):
        """Test session completion with negative duration"""
        response = client.post(
            "/api/v1/sessions/complete",
            json={
                "input": "Math basics",
                "mode": "topic",
                "difficulty": "beginner",
                "count": 2,
                "answers": [0, 1],
                "duration_seconds": -10,
                "questions": sample_quiz_questions
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_complete_session_empty_questions(self):
        """Test session completion with empty questions list"""
        response = client.post(
            "/api/v1/sessions/complete",
            json={
                "input": "Math basics",
                "mode": "topic",
                "difficulty": "beginner",
                "count": 0,
                "answers": [],
                "duration_seconds": 120,
                "questions": []
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_complete_session_answer_count_mismatch(self, sample_quiz_questions):
        """Test session completion with mismatched answer count"""
        with patch('app.api.routes.sessions.get_db') as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_db
            
            # Even with mismatched counts, scoring should handle gracefully
            response = client.post(
                "/api/v1/sessions/complete",
                json={
                    "input": "Math basics",
                    "mode": "topic",
                    "difficulty": "beginner",
                    "count": 2,
                    "answers": [0],  # Only 1 answer for 2 questions
                    "duration_seconds": 120,
                    "questions": sample_quiz_questions
                }
            )
            
            # This should either succeed with partial scoring or fail validation
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_complete_session_advanced_difficulty(self, sample_quiz_questions):
        """Test session completion with advanced difficulty"""
        with patch('app.api.routes.sessions.get_db') as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_db
            
            mock_db.add = MagicMock()
            mock_db.commit = AsyncMock()
            mock_db.refresh = AsyncMock()
            
            response = client.post(
                "/api/v1/sessions/complete",
                json={
                    "input": "Advanced calculus",
                    "mode": "topic",
                    "difficulty": "advanced",
                    "count": 2,
                    "answers": [0, 1],
                    "duration_seconds": 300,
                    "questions": sample_quiz_questions
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
    
    def test_complete_session_notes_mode(self, sample_quiz_questions):
        """Test session completion with notes mode"""
        with patch('app.api.routes.sessions.get_db') as mock_get_db:
            mock_db = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_db
            
            mock_db.add = MagicMock()
            mock_db.commit = AsyncMock()
            mock_db.refresh = AsyncMock()
            
            response = client.post(
                "/api/v1/sessions/complete",
                json={
                    "input": "Plants use photosynthesis to make food",
                    "mode": "notes",
                    "difficulty": "intermediate",
                    "count": 2,
                    "answers": [0, 1],
                    "duration_seconds": 150,
                    "questions": sample_quiz_questions
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
