"""initial schema"""

from alembic import op
import sqlalchemy as sa

revision = "20260404_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("player_name", sa.String(length=120), nullable=True),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("input_mode", sa.String(length=20), nullable=False),
        sa.Column("difficulty", sa.String(length=20), nullable=False),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column("correct_answers", sa.Integer(), nullable=False),
        sa.Column("score_percent", sa.Integer(), nullable=False),
        sa.Column("xp_earned", sa.Integer(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "quiz_attempt_questions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("attempt_id", sa.String(), sa.ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("tag", sa.String(length=80), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("choices", sa.JSON(), nullable=False),
        sa.Column("correct_index", sa.Integer(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
    )
    op.create_table(
        "quiz_attempt_answers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("attempt_id", sa.String(), sa.ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_position", sa.Integer(), nullable=False),
        sa.Column("selected_index", sa.Integer(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "challenges",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("public_id", sa.String(length=40), nullable=False),
        sa.Column("attempt_id", sa.String(), sa.ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("topic", sa.String(length=255), nullable=False),
        sa.Column("difficulty", sa.String(length=20), nullable=False),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column("questions", sa.JSON(), nullable=False),
        sa.Column("creator_name", sa.String(length=120), nullable=False),
        sa.Column("creator_score", sa.Integer(), nullable=False),
        sa.Column("creator_time", sa.Integer(), nullable=False),
        sa.Column("challenger_name", sa.String(length=120), nullable=True),
        sa.Column("challenger_score", sa.Integer(), nullable=True),
        sa.Column("challenger_time", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_challenges_public_id", "challenges", ["public_id"], unique=True)


def downgrade():
    op.drop_index("ix_challenges_public_id", table_name="challenges")
    op.drop_table("challenges")
    op.drop_table("quiz_attempt_answers")
    op.drop_table("quiz_attempt_questions")
    op.drop_table("quiz_attempts")
