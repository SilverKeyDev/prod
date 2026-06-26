"""Workspace conversations tables and chat_history.workspace_conversation_id.

Revision ID: l7e8f9a0b1c2
Revises: k6f7a8b9c0d1
Create Date: 2026-06-04

Idempotent: workspace tables may already exist from prior create_all(); always
ensures chat_history.workspace_conversation_id is present.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "l7e8f9a0b1c2"
down_revision = "k6f7a8b9c0d1"
branch_labels = None
depends_on = None

_FK_CHAT_HISTORY_WORKSPACE_CONV = "fk_chat_history_workspace_conversation_id"
_IX_CHAT_HISTORY_WORKSPACE_CONV = "ix_chat_history_workspace_conversation_id"


def _column_names(insp, table: str) -> set[str]:
    if not insp.has_table(table):
        return set()
    return {c["name"] for c in insp.get_columns(table)}


def _index_names(insp, table: str) -> set[str]:
    if not insp.has_table(table):
        return set()
    return {ix["name"] for ix in insp.get_indexes(table)}


def _fk_names(insp, table: str) -> set[str]:
    if not insp.has_table(table):
        return set()
    return {fk["name"] for fk in insp.get_foreign_keys(table) if fk.get("name")}


def _create_workspace_tables(insp) -> None:
    if not insp.has_table("workspace_conversations"):
        op.create_table(
            "workspace_conversations",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("kind", sa.String(length=32), nullable=False),
            sa.Column("brokerage_org_id", sa.String(length=36), nullable=True),
            sa.Column("partner_id", sa.String(length=36), nullable=True),
            sa.Column("subject_user_id", sa.String(length=36), nullable=True),
            sa.Column("support_category", sa.String(length=32), nullable=True),
            sa.Column("agent_user_id", sa.String(length=36), nullable=True),
            sa.Column("title", sa.String(length=120), nullable=True),
            sa.Column("created_by_user_id", sa.String(length=36), nullable=True),
            sa.Column(
                "participant_count", sa.Integer(), server_default=sa.text("0"), nullable=False
            ),
            sa.Column("is_archived", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("last_message_at", sa.DateTime(), nullable=True),
            sa.Column("last_read_at", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["agent_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["brokerage_org_id"], ["brokerage_orgs.id"]),
            sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["partner_id"], ["partners.id"]),
            sa.ForeignKeyConstraint(["subject_user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "kind",
                "subject_user_id",
                "support_category",
                name="uq_workspace_conv_platform_support",
            ),
            sa.UniqueConstraint(
                "kind",
                "brokerage_org_id",
                "agent_user_id",
                name="uq_workspace_conv_brokerage_agent",
            ),
            sa.UniqueConstraint(
                "kind",
                "partner_id",
                "brokerage_org_id",
                name="uq_workspace_conv_integrator_brokerage",
            ),
        )
        op.create_index(
            op.f("ix_workspace_conversations_kind"), "workspace_conversations", ["kind"]
        )
        op.create_index(
            op.f("ix_workspace_conversations_brokerage_org_id"),
            "workspace_conversations",
            ["brokerage_org_id"],
        )
        op.create_index(
            op.f("ix_workspace_conversations_partner_id"),
            "workspace_conversations",
            ["partner_id"],
        )
        op.create_index(
            op.f("ix_workspace_conversations_subject_user_id"),
            "workspace_conversations",
            ["subject_user_id"],
        )
        op.create_index(
            op.f("ix_workspace_conversations_agent_user_id"),
            "workspace_conversations",
            ["agent_user_id"],
        )
        op.create_index(
            "idx_workspace_conv_kind_updated",
            "workspace_conversations",
            ["kind", "updated_at"],
        )

    if not insp.has_table("workspace_conversation_participants"):
        op.create_table(
            "workspace_conversation_participants",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("conversation_id", sa.String(length=36), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("participant_role", sa.String(length=32), nullable=False),
            sa.Column("joined_at", sa.DateTime(), nullable=False),
            sa.Column("left_at", sa.DateTime(), nullable=True),
            sa.Column("added_by_user_id", sa.String(length=36), nullable=True),
            sa.ForeignKeyConstraint(["added_by_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(
                ["conversation_id"],
                ["workspace_conversations.id"],
                ondelete="CASCADE",
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "conversation_id",
                "user_id",
                name="uq_workspace_conv_participant",
            ),
        )
        op.create_index(
            op.f("ix_workspace_conversation_participants_conversation_id"),
            "workspace_conversation_participants",
            ["conversation_id"],
        )
        op.create_index(
            op.f("ix_workspace_conversation_participants_user_id"),
            "workspace_conversation_participants",
            ["user_id"],
        )
        op.create_index(
            "idx_workspace_participant_user_left",
            "workspace_conversation_participants",
            ["user_id", "left_at"],
        )


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    _create_workspace_tables(insp)
    # Re-inspect after possible DDL above.
    insp = inspect(bind)

    chat_cols = _column_names(insp, "chat_history")
    if "workspace_conversation_id" not in chat_cols:
        with op.batch_alter_table("chat_history", schema=None) as batch_op:
            batch_op.add_column(
                sa.Column("workspace_conversation_id", sa.String(length=36), nullable=True)
            )

    insp = inspect(bind)
    if _FK_CHAT_HISTORY_WORKSPACE_CONV not in _fk_names(insp, "chat_history"):
        with op.batch_alter_table("chat_history", schema=None) as batch_op:
            batch_op.create_foreign_key(
                _FK_CHAT_HISTORY_WORKSPACE_CONV,
                "workspace_conversations",
                ["workspace_conversation_id"],
                ["id"],
            )

    insp = inspect(bind)
    if _IX_CHAT_HISTORY_WORKSPACE_CONV not in _index_names(insp, "chat_history"):
        with op.batch_alter_table("chat_history", schema=None) as batch_op:
            batch_op.create_index(
                _IX_CHAT_HISTORY_WORKSPACE_CONV,
                ["workspace_conversation_id"],
                unique=False,
            )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if "workspace_conversation_id" in _column_names(insp, "chat_history"):
        with op.batch_alter_table("chat_history", schema=None) as batch_op:
            if _IX_CHAT_HISTORY_WORKSPACE_CONV in _index_names(insp, "chat_history"):
                batch_op.drop_index(_IX_CHAT_HISTORY_WORKSPACE_CONV)
            if _FK_CHAT_HISTORY_WORKSPACE_CONV in _fk_names(insp, "chat_history"):
                batch_op.drop_constraint(_FK_CHAT_HISTORY_WORKSPACE_CONV, type_="foreignkey")
            batch_op.drop_column("workspace_conversation_id")

    if insp.has_table("workspace_conversation_participants"):
        op.drop_index(
            "idx_workspace_participant_user_left",
            table_name="workspace_conversation_participants",
        )
        op.drop_index(
            op.f("ix_workspace_conversation_participants_user_id"),
            table_name="workspace_conversation_participants",
        )
        op.drop_index(
            op.f("ix_workspace_conversation_participants_conversation_id"),
            table_name="workspace_conversation_participants",
        )
        op.drop_table("workspace_conversation_participants")

    if insp.has_table("workspace_conversations"):
        op.drop_index("idx_workspace_conv_kind_updated", table_name="workspace_conversations")
        op.drop_index(
            op.f("ix_workspace_conversations_agent_user_id"),
            table_name="workspace_conversations",
        )
        op.drop_index(
            op.f("ix_workspace_conversations_subject_user_id"),
            table_name="workspace_conversations",
        )
        op.drop_index(
            op.f("ix_workspace_conversations_partner_id"),
            table_name="workspace_conversations",
        )
        op.drop_index(
            op.f("ix_workspace_conversations_brokerage_org_id"),
            table_name="workspace_conversations",
        )
        op.drop_index(op.f("ix_workspace_conversations_kind"), table_name="workspace_conversations")
        op.drop_table("workspace_conversations")
