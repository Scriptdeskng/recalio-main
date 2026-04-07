"""fix_is_active_column_type

Revision ID: 20260407_0008
Revises: 20260406_0007
Create Date: 2026-04-07 12:08:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260407_0008'
down_revision = '20260406_0007'
branch_labels = None
depends_on = None


def upgrade():
    # Convert is_active from integer to boolean
    # First, update any non-zero values to 1, and zero values to 0
    op.execute("""
        UPDATE subscription_plans 
        SET is_active = CASE 
            WHEN is_active = 0 THEN 0 
            ELSE 1 
        END
    """)
    
    # Drop the existing default before type conversion
    op.execute("""
        ALTER TABLE subscription_plans 
        ALTER COLUMN is_active DROP DEFAULT
    """)
    
    # Now alter the column type to boolean
    op.execute("""
        ALTER TABLE subscription_plans 
        ALTER COLUMN is_active TYPE BOOLEAN 
        USING CASE WHEN is_active = 0 THEN FALSE ELSE TRUE END
    """)
    
    # Set the new boolean default
    op.execute("""
        ALTER TABLE subscription_plans 
        ALTER COLUMN is_active SET DEFAULT TRUE
    """)


def downgrade():
    # Convert boolean back to integer
    op.execute("""
        ALTER TABLE subscription_plans 
        ALTER COLUMN is_active TYPE INTEGER 
        USING CASE WHEN is_active THEN 1 ELSE 0 END
    """)
