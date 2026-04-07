from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, ValidationError
import sys

class Settings(BaseSettings):
    APP_NAME: str = "Recallio API"
    ENV: str = "development"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/recallio"
    ANTHROPIC_API_KEY: str = "replace_me"
    ANTHROPIC_MODEL: str = "claude-haiku-4-5-20251001"
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # Payment Settings
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""
    
    # IntelliHQ Settings
    INTELLIHQ_API_KEY: str = ""
    INTELLIHQ_SERVICE_ID: int = 1

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("ANTHROPIC_API_KEY")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        if v == "replace_me" or not v or len(v) < 10:
            raise ValueError(
                "ANTHROPIC_API_KEY must be set in .env file. "
                "Get your API key from https://console.anthropic.com/"
            )
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not v.startswith("postgresql"):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL connection string")
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.CORS_ORIGINS.split(",") if item.strip()]

try:
    settings = Settings()
except ValidationError as e:
    print(f"Configuration error: {e}", file=sys.stderr)
    print("\nPlease create a .env file with required settings:", file=sys.stderr)
    print("  - ANTHROPIC_API_KEY=your_api_key_here", file=sys.stderr)
    print("  - DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db", file=sys.stderr)
    sys.exit(1)
