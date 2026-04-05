"""add full_name to players"""

from alembic import op
import sqlalchemy as sa

revision = "20260405_0005"
down_revision = "20260405_0004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("players", sa.Column("full_name", sa.String(length=120), nullable=True))


def downgrade():
    op.drop_column("players", "full_name")
