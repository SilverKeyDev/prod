"""add itinerary json to calendar_events

Revision ID: e9c4a1f82b10
Revises: bd3fb2b50c96
Create Date: 2026-04-15

"""

import sqlalchemy as sa
from alembic import op

revision = "e9c4a1f82b10"
down_revision = "bd3fb2b50c96"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("calendar_events", schema=None) as batch_op:
        batch_op.add_column(sa.Column("itinerary", sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table("calendar_events", schema=None) as batch_op:
        batch_op.drop_column("itinerary")
