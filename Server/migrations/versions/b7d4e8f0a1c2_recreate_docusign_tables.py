"""Recreate DocuSign integration tables (reverses 863a510e8d8e drops for new environments).

Revision ID: b7d4e8f0a1c2
Revises: f3e8a91b2c40
Create Date: 2026-04-01

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "b7d4e8f0a1c2"
down_revision = "f3e8a91b2c40"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table("docusign_oauth_tokens"):
        op.create_table(
            "docusign_oauth_tokens",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("access_token", sa.Text(), nullable=False),
            sa.Column("refresh_token", sa.Text(), nullable=False),
            sa.Column("token_expires_at", sa.DateTime(), nullable=False),
            sa.Column("account_id", sa.String(length=100), nullable=False),
            sa.Column("base_uri", sa.String(length=255), nullable=False),
            sa.Column("scopes", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(
                ["user_id"], ["users.id"], name=op.f("docusign_oauth_tokens_user_id_fkey")
            ),
            sa.PrimaryKeyConstraint("id", name=op.f("docusign_oauth_tokens_pkey")),
            sa.UniqueConstraint("user_id", name=op.f("docusign_oauth_tokens_user_id_key")),
        )

    if not insp.has_table("docusign_connect_events"):
        op.create_table(
            "docusign_connect_events",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("envelope_id", sa.String(length=100), nullable=False),
            sa.Column("event_type", sa.String(length=50), nullable=False),
            sa.Column("event_timestamp", sa.DateTime(), nullable=False),
            sa.Column("payload", sa.Text(), nullable=False),
            sa.Column("processed", sa.Boolean(), nullable=True),
            sa.Column("processed_at", sa.DateTime(), nullable=True),
            sa.Column("processing_error", sa.Text(), nullable=True),
            sa.Column("retry_count", sa.Integer(), nullable=True),
            sa.Column("hmac_verified", sa.Boolean(), nullable=True),
            sa.Column("received_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id", name=op.f("docusign_connect_events_pkey")),
        )
        with op.batch_alter_table("docusign_connect_events", schema=None) as batch_op:
            batch_op.create_index(
                batch_op.f("ix_docusign_connect_events_envelope_id"), ["envelope_id"], unique=False
            )
            batch_op.create_index(
                "idx_envelope_event_time",
                ["envelope_id", "event_type", "event_timestamp"],
                unique=True,
            )

    if not insp.has_table("docusign_templates"):
        op.create_table(
            "docusign_templates",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("docusign_template_id", sa.String(length=100), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("template_variables", sa.Text(), nullable=True),
            sa.Column("category", sa.String(length=50), nullable=True),
            sa.Column("synced_at", sa.DateTime(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.PrimaryKeyConstraint("id", name=op.f("docusign_templates_pkey")),
            sa.UniqueConstraint(
                "docusign_template_id", name=op.f("docusign_templates_docusign_template_id_key")
            ),
        )


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    if insp.has_table("docusign_templates"):
        op.drop_table("docusign_templates")
    if insp.has_table("docusign_connect_events"):
        with op.batch_alter_table("docusign_connect_events", schema=None) as batch_op:
            batch_op.drop_index("idx_envelope_event_time")
            batch_op.drop_index("ix_docusign_connect_events_envelope_id")
        op.drop_table("docusign_connect_events")
    if insp.has_table("docusign_oauth_tokens"):
        op.drop_table("docusign_oauth_tokens")
