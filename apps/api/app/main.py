from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, quizzes, sessions, challenges, auth, players, subscriptions, webhooks
from app.db.session import get_db
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

@app.on_event("startup")
async def startup_event():
    """Check database connection on startup"""
    try:
        logger.info("Checking database connection...")
        async for db in get_db():
            # Try a simple query
            from sqlalchemy import text
            result = await db.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful!")
            break
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        logger.error("Please check:")
        logger.error("1. DATABASE_URL environment variable")
        logger.error("2. Database credentials match")
        logger.error("3. Database server is running")
        raise

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(quizzes.router)
app.include_router(sessions.router)
app.include_router(challenges.router)
app.include_router(auth.router)
app.include_router(players.router)
app.include_router(subscriptions.router)
app.include_router(webhooks.router)
