"""Todos: nullable due_date and priority for optional fields.

Revision ID: e8f1a2b33c10
Revises: c8f2a1b04e52
Create Date: 2026-03-24

"""

import sqlalchemy as sa
from alembic import op

revision = "e8f1a2b33c10"
down_revision = "c8f2a1b04e52"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("todos", schema=None) as batch_op:
        batch_op.alter_column(
            "due_date",
            existing_type=sa.DateTime(),
            nullable=True,
        )
        batch_op.alter_column(
            "priority",
            existing_type=sa.String(length=20),
            nullable=True,
        )


def downgrade():
    with op.batch_alter_table("todos", schema=None) as batch_op:
        batch_op.alter_column(
            "priority",
            existing_type=sa.String(length=20),
            nullable=False,
        )
        batch_op.alter_column(
            "due_date",
            existing_type=sa.DateTime(),
            nullable=False,
        )
