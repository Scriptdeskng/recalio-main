"""add player_id to quiz_attempts and challenges"""

from alembic import op
import sqlalchemy as sa

revision = "20260405_0006"
down_revision = "20260405_0005"
branch_labels = None
depends_on = None


def upgrade():
    # Add player_id to quiz_attempts
    op.add_column("quiz_attempts", sa.Column("player_id", sa.Integer(), nullable=True))
    op.create_index("ix_quiz_attempts_player_id", "quiz_attempts", ["player_id"])
    op.create_foreign_key(
        "fk_quiz_attempts_player_id",
        "quiz_attempts",
        "players",
        ["player_id"],
        ["id"],
        ondelete="SET NULL"
    )
    
    # Add player_id to challenges
    op.add_column("challenges", sa.Column("player_id", sa.Integer(), nullable=True))
    op.create_index("ix_challenges_player_id", "challenges", ["player_id"])
    op.create_foreign_key(
        "fk_challenges_player_id",
        "challenges",
        "players",
        ["player_id"],
        ["id"],
        ondelete="SET NULL"
    )


def downgrade():
    # Remove from challenges
    op.drop_constraint("fk_challenges_player_id", "challenges", type_="foreignkey")
    op.drop_index("ix_challenges_player_id", "challenges")
    op.drop_column("challenges", "player_id")
    
    # Remove from quiz_attempts
    op.drop_constraint("fk_quiz_attempts_player_id", "quiz_attempts", type_="foreignkey")
    op.drop_index("ix_quiz_attempts_player_id", "quiz_attempts")
    op.drop_column("quiz_attempts", "player_id")
