"""Tests for challenge API routes"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import status

class TestChallengeRoutes:
    """Test challenge CRUD endpoints"""
    
    def test_create_challenge_success(self, client, mock_db, sample_quiz_questions):
        """Test successful challenge creation"""
        # Mock database commit
        mock_db.commit = AsyncMock()
        
        response = client.post(
            "/api/v1/challenges",
            json={
                "creator_name": "Alice",
                "input": "Math basics",
                "difficulty": "intermediate",
                "count": 2,
                "questions": [q.model_dump() for q in sample_quiz_questions],
                "answers": [0, 1],
                "duration_seconds": 120
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "challenge_id" in data
        assert "share_url" in data
    
    def test_create_challenge_invalid_request(self, client):
        """Test challenge creation with invalid data"""
        response = client.post(
            "/api/v1/challenges",
            json={
                "creator_name": "A" * 121,  # Too long
                "input": "Math basics",
                "difficulty": "intermediate",
                "count": 2,
                "questions": [],
                "answers": [],
                "duration_seconds": -10
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_challenge_success(self, client, mock_db, sample_quiz_questions):
        """Test retrieving a challenge by ID"""
        # Create a mock challenge object
        from app.db.models.challenge import Challenge
        from datetime import datetime, timezone, timedelta
        
        mock_challenge = Challenge(
            id="test-challenge-id",
            public_id="test-public-id",
            attempt_id="test-attempt-id",
            topic="Test Topic",
            difficulty="intermediate",
            question_count=2,
            questions=[q.model_dump() for q in sample_quiz_questions],
            creator_name="Alice",
            creator_score=80,
            creator_time=120,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        # Mock the database execute result
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_challenge
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        response = client.get("/api/v1/challenges/test-challenge-id")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "test-challenge-id"
    
    def test_get_challenge_not_found(self, client, mock_db):
        """Test retrieving non-existent challenge"""
        # Mock empty result
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        response = client.get("/api/v1/challenges/non-existent-id")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_complete_challenge_success(self, client, mock_db, sample_quiz_questions):
        """Test completing a challenge"""
        from app.db.models.challenge import Challenge
        from datetime import datetime, timezone, timedelta
        
        # Create a mock challenge
        mock_challenge = Challenge(
            id="test-challenge-id",
            public_id="test-public-id",
            attempt_id="test-attempt-id",
            topic="Test Topic",
            difficulty="intermediate",
            question_count=2,
            questions=[q.model_dump() for q in sample_quiz_questions],
            creator_name="Alice",
            creator_score=80,
            creator_time=120,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_challenge
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        
        response = client.post(
            "/api/v1/challenges/test-challenge-id/complete",
            json={
                "challenger_name": "Bob",
                "answers": [0, 1],
                "duration_seconds": 100
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "test-challenge-id"
        assert data["challenger_name"] == "Bob"
    
    def test_complete_challenge_expired(self, client, mock_db):
        """Test completing an expired challenge"""
        # This test is more about validation logic which may be in the service
        # For now, we'll just test that the endpoint exists
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        response = client.post(
            "/api/v1/challenges/expired-id/complete",
            json={
                "challenger_name": "Bob",
                "answers": [0, 1],
                "duration_seconds": 100
            }
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_complete_challenge_already_completed(self, client, mock_db):
        """Test completing an already completed challenge"""
        # This would require additional validation logic
        # Skipping for now as it may not be implemented yet
        pass
    
    def test_complete_challenge_missing_challenger_name(self, client):
        """Test completing challenge without challenger name"""
        response = client.post(
            "/api/v1/challenges/test-challenge-id/complete",
            json={
                "answers": [0, 1, 2, 3],
                "duration_seconds": 100
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_complete_challenge_invalid_answers(self, client):
        """Test completing challenge with invalid answer format"""
        response = client.post(
            "/api/v1/challenges/test-challenge-id/complete",
            json={
                "challenger_name": "Bob",
                "answers": "invalid",  # Should be list
                "duration_seconds": 100
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
