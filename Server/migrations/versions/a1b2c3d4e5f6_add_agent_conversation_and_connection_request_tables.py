"""Add agent_conversation and connection_request tables

Revision ID: a1b2c3d4e5f6
Revises: b59fd3e8a725
Create Date: 2025-01-15 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "b59fd3e8a725"
branch_labels = None
depends_on = None


def upgrade():
    # Create agent_conversations table
    op.create_table(
        "agent_conversations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("agent_id", sa.String(length=36), nullable=False),
        sa.Column("client_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("last_message_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create agent_connection_requests table
    op.create_table(
        "agent_connection_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("agent_id", sa.String(length=36), nullable=False),
        sa.Column("client_id", sa.String(length=36), nullable=False),
        sa.Column("requested_by_agent", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add conversation_id and sender_id to chat_history table
    with op.batch_alter_table("chat_history", schema=None) as batch_op:
        batch_op.add_column(sa.Column("conversation_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("sender_id", sa.String(length=36), nullable=True))
        batch_op.alter_column("report_id", existing_type=sa.String(length=255), nullable=True)
        batch_op.create_foreign_key(
            "fk_chat_history_conversation", "agent_conversations", ["conversation_id"], ["id"]
        )

    # Create indexes for performance
    op.create_index("ix_agent_conversations_agent_id", "agent_conversations", ["agent_id"])
    op.create_index("ix_agent_conversations_client_id", "agent_conversations", ["client_id"])
    op.create_index(
        "ix_agent_connection_requests_agent_id", "agent_connection_requests", ["agent_id"]
    )
    op.create_index(
        "ix_agent_connection_requests_client_id", "agent_connection_requests", ["client_id"]
    )
    op.create_index("ix_agent_connection_requests_status", "agent_connection_requests", ["status"])
    op.create_index("ix_chat_history_conversation_id", "chat_history", ["conversation_id"])


def downgrade():
    # Drop indexes
    op.drop_index("ix_chat_history_conversation_id", table_name="chat_history")
    op.drop_index("ix_agent_connection_requests_status", table_name="agent_connection_requests")
    op.drop_index("ix_agent_connection_requests_client_id", table_name="agent_connection_requests")
    op.drop_index("ix_agent_connection_requests_agent_id", table_name="agent_connection_requests")
    op.drop_index("ix_agent_conversations_client_id", table_name="agent_conversations")
    op.drop_index("ix_agent_conversations_agent_id", table_name="agent_conversations")

    # Remove columns from chat_history
    with op.batch_alter_table("chat_history", schema=None) as batch_op:
        batch_op.drop_constraint("fk_chat_history_conversation", type_="foreignkey")
        batch_op.alter_column("report_id", existing_type=sa.String(length=255), nullable=False)
        batch_op.drop_column("sender_id")
        batch_op.drop_column("conversation_id")

    # Drop tables
    op.drop_table("agent_connection_requests")
    op.drop_table("agent_conversations")
