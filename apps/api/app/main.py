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
        logger.info("=" * 50)
        logger.info("🚀 Starting Recallio API")
        logger.info(f"Environment: {settings.ENV}")
        
        # Show database connection details (hide password)
        db_url = settings.DATABASE_URL
        if "@" in db_url:
            parts = db_url.split("@")
            masked_url = parts[0].split(":")[:-1]  # Remove password
            masked_url.append("****@" + parts[1])
            logger.info(f"Database: {':'.join(masked_url)}")
        
        logger.info("Checking database connection...")
        async for db in get_db():
            # Try a simple query
            from sqlalchemy import text
            result = await db.execute(text("SELECT version()"))
            version = result.scalar()
            logger.info(f"✅ Database connection successful!")
            logger.info(f"   PostgreSQL: {version}")
            break
        logger.info("=" * 50)
    except Exception as e:
        logger.error("=" * 50)
        logger.error(f"❌ Database connection failed: {str(e)}")
        logger.error("")
        logger.error("Troubleshooting steps:")
        logger.error("1. Check DATABASE_URL in environment")
        logger.error("2. Verify database credentials match")
        logger.error("3. Ensure database container is running")
        logger.error("4. Check network connectivity to database")
        logger.error("")
        logger.error(f"Current DATABASE_URL pattern: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'invalid'}")
        logger.error("=" * 50)
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
