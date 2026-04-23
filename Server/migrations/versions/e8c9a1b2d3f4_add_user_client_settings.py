"""Add user_client_settings for JSON-backed client UI state.

Revision ID: e8c9a1b2d3f4
Revises: d4e9f1a2b3c5
Create Date: 2026-04-20

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "e8c9a1b2d3f4"
down_revision = "d4e9f1a2b3c5"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    if insp.has_table("user_client_settings"):
        return
    op.create_table(
        "user_client_settings",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column(
            "settings",
            postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"),
            nullable=False,
        ),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    if insp.has_table("user_client_settings"):
        op.drop_table("user_client_settings")
