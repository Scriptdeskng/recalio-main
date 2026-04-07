"""Add subscription tables

Revision ID: 20260406_0007
Revises: 20260405_0006
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260406_0007'
down_revision = '20260405_0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create subscription_plans table
    op.create_table(
        'subscription_plans',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('period', sa.Enum('daily', 'weekly', 'monthly', name='planperiod'), nullable=False),
        sa.Column('price', sa.Integer(), nullable=False),
        sa.Column('allowed_payment_methods', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_subscription_plans_period'), 'subscription_plans', ['period'], unique=False)

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('player_id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'active', 'grace', 'suspended', 'churned', 'cancelled', name='subscriptionstatus'), nullable=False),
        sa.Column('provider', sa.Enum('intellihq', 'paystack', name='paymentprovider'), nullable=False),
        sa.Column('payment_reference', sa.String(length=255), nullable=True),
        sa.Column('authorization_code', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('intellihq_subscription_id', sa.Integer(), nullable=True),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('next_billing_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('auto_renew', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ),
        sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscriptions_player_id'), 'subscriptions', ['player_id'], unique=False)
    op.create_index(op.f('ix_subscriptions_status'), 'subscriptions', ['status'], unique=False)
    op.create_index(op.f('ix_subscriptions_payment_reference'), 'subscriptions', ['payment_reference'], unique=False)
    op.create_index(op.f('ix_subscriptions_intellihq_subscription_id'), 'subscriptions', ['intellihq_subscription_id'], unique=False)

    # Seed subscription plans
    op.execute("""
        INSERT INTO subscription_plans (name, period, price, allowed_payment_methods, description, created_at, updated_at)
        VALUES
            ('Daily Plan', 'daily', 7000, 'airtime', 'Pay daily with MTN airtime', NOW(), NOW()),
            ('Weekly Plan', 'weekly', 20000, 'airtime,card', 'Pay weekly with airtime or card', NOW(), NOW()),
            ('Monthly Plan', 'monthly', 60000, 'card', 'Pay monthly with card', NOW(), NOW())
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_subscriptions_intellihq_subscription_id'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_payment_reference'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_status'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_player_id'), table_name='subscriptions')
    op.drop_table('subscriptions')
    
    op.drop_index(op.f('ix_subscription_plans_period'), table_name='subscription_plans')
    op.drop_table('subscription_plans')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS subscriptionstatus')
    op.execute('DROP TYPE IF EXISTS paymentprovider')
    op.execute('DROP TYPE IF EXISTS planperiod')
