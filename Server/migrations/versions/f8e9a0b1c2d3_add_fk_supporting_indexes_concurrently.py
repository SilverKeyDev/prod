"""Add btree indexes on foreign-key columns (CREATE INDEX CONCURRENTLY).

Revision ID: f8e9a0b1c2d3
Revises: e1f2a3b4c5d7
Create Date: 2026-05-13

PostgreSQL cannot build these indexes inside Alembic's default transaction;
each statement runs inside op.get_context().autocommit_block().

Downgrade uses DROP INDEX CONCURRENTLY (PostgreSQL 14+) inside autocommit blocks.
"""

from __future__ import annotations

from alembic import op

revision = "f8e9a0b1c2d3"
down_revision = "e1f2a3b4c5d7"
branch_labels = None
depends_on = None

# (index_name, table_name, [columns]) — single-column btree supporting FK joins/deletes
_FK_INDEXES: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("ix_agreement_events_actor_id", "agreement_events", ("actor_id",)),
    ("ix_agreement_participants_user_id", "agreement_participants", ("user_id",)),
    ("ix_agreement_revisions_created_by", "agreement_revisions", ("created_by",)),
    ("ix_agreements_agent_id", "agreements", ("agent_id",)),
    ("ix_agreements_buyer_id", "agreements", ("buyer_id",)),
    ("ix_agent_connection_requests_agent_id", "agent_connection_requests", ("agent_id",)),
    ("ix_agent_connection_requests_client_id", "agent_connection_requests", ("client_id",)),
    ("ix_agent_conversations_agent_id", "agent_conversations", ("agent_id",)),
    ("ix_agent_conversations_client_id", "agent_conversations", ("client_id",)),
    ("ix_calendar_events_creator_id", "calendar_events", ("creator_id",)),
    ("ix_calendar_events_target_user_id", "calendar_events", ("target_user_id",)),
    ("ix_calendar_events_user_id", "calendar_events", ("user_id",)),
    ("ix_calendar_shares_calendar_owner_id", "calendar_shares", ("calendar_owner_id",)),
    ("ix_calendar_shares_shared_with_user_id", "calendar_shares", ("shared_with_user_id",)),
    ("ix_chat_history_conversation_id", "chat_history", ("conversation_id",)),
    ("ix_documents_user_id", "documents", ("user_id",)),
    (
        "ix_docusign_templates_created_by_user_id",
        "docusign_templates",
        ("created_by_user_id",),
    ),
    ("ix_search_session_user_id", "search_session", ("user_id",)),
    ("ix_todos_agent_id", "todos", ("agent_id",)),
    ("ix_todos_client_id", "todos", ("client_id",)),
    ("ix_user_tasks_user_id", "user_tasks", ("user_id",)),
    ("ix_transactions_buyer_id", "transactions", ("buyer_id",)),
    ("ix_transactions_primary_agent_id", "transactions", ("primary_agent_id",)),
    ("ix_user_calendar_connections_user_id", "user_calendar_connections", ("user_id",)),
    ("ix_user_important_locations_user_id", "user_important_locations", ("user_id",)),
    ("ix_user_intent_attributes_user_id", "user_intent_attributes", ("user_id",)),
)


def upgrade() -> None:
    for index_name, table_name, columns in _FK_INDEXES:
        with op.get_context().autocommit_block():
            op.create_index(
                index_name,
                table_name,
                list(columns),
                unique=False,
                postgresql_concurrently=True,
                if_not_exists=True,
            )


def downgrade() -> None:
    # Drop in reverse order; CONCURRENTLY cannot run inside a normal transaction.
    for index_name, table_name, _columns in reversed(_FK_INDEXES):
        with op.get_context().autocommit_block():
            op.drop_index(
                index_name,
                table_name=table_name,
                postgresql_concurrently=True,
                if_exists=True,
            )
