"""add timezone to datetime columns

Revision ID: 20260405_0002
Revises: 20260404_0001
Create Date: 2026-04-05 17:56:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260405_0002'
down_revision: Union[str, None] = '20260404_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change TIMESTAMP WITHOUT TIME ZONE to TIMESTAMP WITH TIME ZONE
    # PostgreSQL will convert existing data to UTC
    
    # quiz_attempts table
    op.execute("""
        ALTER TABLE quiz_attempts 
        ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
        USING created_at AT TIME ZONE 'UTC'
    """)
    
    # challenges table  
    op.execute("""
        ALTER TABLE challenges 
        ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
        USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE 
        USING expires_at AT TIME ZONE 'UTC'
    """)


def downgrade() -> None:
    # Revert back to TIMESTAMP WITHOUT TIME ZONE
    
    # quiz_attempts table
    op.execute("""
        ALTER TABLE quiz_attempts 
        ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE 
        USING created_at AT TIME ZONE 'UTC'
    """)
    
    # challenges table
    op.execute("""
        ALTER TABLE challenges 
        ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE 
        USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN expires_at TYPE TIMESTAMP WITHOUT TIME ZONE 
        USING expires_at AT TIME ZONE 'UTC'
    """)
