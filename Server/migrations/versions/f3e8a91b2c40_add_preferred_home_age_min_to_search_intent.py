"""Add preferred_home_age_min to user_search_intent

Revision ID: f3e8a91b2c40
Revises: e8f1a2b33c10
Create Date: 2026-03-24

"""

import sqlalchemy as sa
from alembic import op

revision = "f3e8a91b2c40"
down_revision = "e8f1a2b33c10"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user_search_intent", schema=None) as batch_op:
        batch_op.add_column(sa.Column("preferred_home_age_min", sa.Integer(), nullable=True))


def downgrade():
    with op.batch_alter_table("user_search_intent", schema=None) as batch_op:
        batch_op.drop_column("preferred_home_age_min")
