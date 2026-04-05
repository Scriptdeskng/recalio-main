"""make attempt_id nullable in challenges

Revision ID: 20260405_0003
Revises: 20260405_0002
Create Date: 2026-04-05 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260405_0003'
down_revision: Union[str, None] = '20260405_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make attempt_id nullable in challenges table
    op.alter_column('challenges', 'attempt_id',
                    existing_type=sa.VARCHAR(),
                    nullable=True)


def downgrade() -> None:
    # Make attempt_id NOT NULL again
    op.alter_column('challenges', 'attempt_id',
                    existing_type=sa.VARCHAR(),
                    nullable=False)
