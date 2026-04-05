"""add players table"""

from alembic import op
import sqlalchemy as sa

revision = "20260405_0004"
down_revision = "20260405_0003"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("msisdn", sa.String(length=20), nullable=False),
        sa.Column("telco", sa.String(length=10), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=True),
        sa.Column("has_any_subscription", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("has_active_subscription", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("subscription_data", sa.JSON(), nullable=True),
        sa.Column("last_subscription_check", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_players_msisdn", "players", ["msisdn"], unique=True)


def downgrade():
    op.drop_index("ix_players_msisdn", table_name="players")
    op.drop_table("players")
