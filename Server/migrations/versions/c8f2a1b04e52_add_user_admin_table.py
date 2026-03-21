"""Add user_admin table (user_id PK, is_admin boolean).

Revision ID: c8f2a1b04e52
Revises: a3379a2da9b3
Create Date: 2026-03-20

"""

import sqlalchemy as sa
from alembic import op

revision = "c8f2a1b04e52"
down_revision = "a3379a2da9b3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_admin",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade():
    op.drop_table("user_admin")
