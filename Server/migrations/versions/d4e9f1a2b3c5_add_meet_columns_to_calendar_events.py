"""Add meet_url and conference_status to calendar_events.

Revision ID: d4e9f1a2b3c5
Revises: f6a7b8c9d0e1
Create Date: 2026-04-20

"""

import sqlalchemy as sa
from alembic import op

revision = "d4e9f1a2b3c5"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("calendar_events", schema=None) as batch_op:
        batch_op.add_column(sa.Column("meet_url", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("conference_status", sa.String(length=32), nullable=True))


def downgrade():
    with op.batch_alter_table("calendar_events", schema=None) as batch_op:
        batch_op.drop_column("conference_status")
        batch_op.drop_column("meet_url")
