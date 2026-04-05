"""Test configuration and fixtures"""
import os
import pytest
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
import asyncio
from fastapi.testclient import TestClient

# Set test environment variables BEFORE any app imports
os.environ["ANTHROPIC_API_KEY"] = "test_api_key_1234567890"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_db():
    """Mock database session"""
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.execute = AsyncMock()
    db.scalar = AsyncMock()
    db.scalars = AsyncMock()
    return db

@pytest.fixture
def client(mock_db):
    """Test client with mocked database"""
    from app.main import app
    from app.core.database import get_db
    
    async def override_get_db():
        yield mock_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def mock_settings(monkeypatch):
    """Mock settings for tests"""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test_api_key_1234567890")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")
    from app.core import config
    # Force reload settings
    config.settings = config.Settings()
    return config.settings

@pytest.fixture
def sample_quiz_questions():
    """Sample quiz questions for testing"""
    from app.schemas.quiz import QuizQuestion
    return [
        QuizQuestion(
            tag="science",
            q="What is the chemical formula for water?",
            choices=["H2O", "CO2", "O2", "H2"],
            correct=0,
            explanation="Water is H2O - two hydrogen atoms and one oxygen atom"
        ),
        QuizQuestion(
            tag="science",
            q="What is the speed of light?",
            choices=["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"],
            correct=0,
            explanation="The speed of light in vacuum is approximately 300,000 km/s"
        )
    ]

@pytest.fixture
def sample_quiz_request():
    """Sample quiz generation request"""
    return {
        "input": "Basic science concepts",
        "mode": "topic",
        "difficulty": "beginner",
        "count": 5
    }

@pytest.fixture
def sample_challenge_request(sample_quiz_questions):
    """Sample challenge creation request"""
    return {
        "attempt_id": None,
        "creator_name": "Test User",
        "input": "Science quiz",
        "difficulty": "intermediate",
        "count": 2,
        "questions": sample_quiz_questions,
        "answers": [0, 0],
        "duration_seconds": 120
    }
