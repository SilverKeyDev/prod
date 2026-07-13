"""SIL-306: email campaign tables for A/B brokerage campaigns.

Revision ID: o1b2c3d4e5f6
Revises: 762ca378e56d
Create Date: 2026-07-12
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "o1b2c3d4e5f6"
down_revision = "762ca378e56d"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table("email_campaigns"):
        op.create_table(
            "email_campaigns",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("brokerage_id", sa.String(length=36), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("goal_metric", sa.String(length=64), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("sent_at", sa.DateTime(), nullable=True),
            sa.Column("baseline_attach_rate_percent", sa.Float(), nullable=True),
            sa.Column("post_attach_rate_percent", sa.Float(), nullable=True),
            sa.ForeignKeyConstraint(["brokerage_id"], ["brokerage_orgs.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_email_campaigns_brokerage_id", "email_campaigns", ["brokerage_id"])
        op.create_index(
            "ix_email_campaigns_brokerage_status",
            "email_campaigns",
            ["brokerage_id", "status"],
        )

    if not insp.has_table("email_campaign_variants"):
        op.create_table(
            "email_campaign_variants",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("campaign_id", sa.String(length=36), nullable=False),
            sa.Column("variant_key", sa.String(length=1), nullable=False),
            sa.Column("subject", sa.String(length=500), nullable=False),
            sa.Column("body_template", sa.Text(), nullable=False),
            sa.ForeignKeyConstraint(["campaign_id"], ["email_campaigns.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("campaign_id", "variant_key", name="uq_campaign_variant_key"),
        )
        op.create_index(
            "ix_email_campaign_variants_campaign_id",
            "email_campaign_variants",
            ["campaign_id"],
        )

    if not insp.has_table("email_campaign_recipients"):
        op.create_table(
            "email_campaign_recipients",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("campaign_id", sa.String(length=36), nullable=False),
            sa.Column("agent_id", sa.String(length=36), nullable=False),
            sa.Column("agent_name", sa.String(length=255), nullable=True),
            sa.Column("variant_key", sa.String(length=1), nullable=False),
            sa.Column("send_status", sa.String(length=32), nullable=False),
            sa.Column("sent_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["campaign_id"], ["email_campaigns.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("campaign_id", "agent_id", name="uq_campaign_recipient_agent"),
        )
        op.create_index(
            "ix_email_campaign_recipients_campaign_id",
            "email_campaign_recipients",
            ["campaign_id"],
        )
        op.create_index(
            "ix_email_campaign_recipients_agent_id",
            "email_campaign_recipients",
            ["agent_id"],
        )

    if not insp.has_table("email_campaign_events"):
        op.create_table(
            "email_campaign_events",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("recipient_id", sa.String(length=36), nullable=False),
            sa.Column("event_type", sa.String(length=32), nullable=False),
            sa.Column("occurred_at", sa.DateTime(), nullable=False),
            sa.Column("service", sa.String(length=64), nullable=True),
            sa.Column("attributed", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.ForeignKeyConstraint(["recipient_id"], ["email_campaign_recipients.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "ix_email_campaign_events_recipient_id",
            "email_campaign_events",
            ["recipient_id"],
        )
        op.create_index(
            "ix_email_campaign_events_type_occurred",
            "email_campaign_events",
            ["event_type", "occurred_at"],
        )


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    for table in (
        "email_campaign_events",
        "email_campaign_recipients",
        "email_campaign_variants",
        "email_campaigns",
    ):
        if insp.has_table(table):
            op.drop_table(table)
