"""add checklist_item_dispatch_settings table

Revision ID: c8a91d2e4f70
Revises: e9c4a1f82b10
Create Date: 2026-04-17

"""

import sqlalchemy as sa
from alembic import op

revision = "c8a91d2e4f70"
down_revision = "e9c4a1f82b10"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "checklist_item_dispatch_settings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("agent_user_id", sa.String(length=36), nullable=False),
        sa.Column("client_user_id", sa.String(length=36), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("item_id", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("recipient_scope", sa.String(length=30), nullable=False),
        sa.Column("selected_client_ids", sa.JSON(), nullable=True),
        sa.Column("note_mode", sa.String(length=20), nullable=False),
        sa.Column("note_broadcast", sa.Text(), nullable=True),
        sa.Column("notes_per_client", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["agent_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["client_user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "agent_user_id",
            "client_user_id",
            "category",
            "item_id",
            name="uq_checklist_dispatch_agent_client_category_item",
        ),
    )
    op.create_index(
        op.f("ix_checklist_item_dispatch_settings_agent_user_id"),
        "checklist_item_dispatch_settings",
        ["agent_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_checklist_item_dispatch_settings_client_user_id"),
        "checklist_item_dispatch_settings",
        ["client_user_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("ix_checklist_item_dispatch_settings_client_user_id"),
        table_name="checklist_item_dispatch_settings",
    )
    op.drop_index(
        op.f("ix_checklist_item_dispatch_settings_agent_user_id"),
        table_name="checklist_item_dispatch_settings",
    )
    op.drop_table("checklist_item_dispatch_settings")
