import sys
import os
from pathlib import Path
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Add parent directory to path to import app module
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.base import Base
from app.db.models import *  # noqa

config = context.config

# Override sqlalchemy.url with DATABASE_URL from environment if present
database_url = os.getenv("DATABASE_URL")
if database_url:
    # Alembic uses psycopg (sync), so convert asyncpg URL if needed
    if "asyncpg" in database_url:
        database_url = database_url.replace("+asyncpg", "").replace("postgresql://", "postgresql+psycopg://")
    config.set_main_option("sqlalchemy.url", database_url)

# Configure logging only if the ini file has logging configuration
if config.config_file_name is not None and config.get_section("loggers") is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
