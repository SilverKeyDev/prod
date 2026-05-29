"""add rev-share partner placement and analytics tables

Revision ID: a9b0c1d2e3f4
Revises: f8e9a0b1c2d3
Create Date: 2026-05-21

"""

import sqlalchemy as sa
from alembic import op

revision = "a9b0c1d2e3f4"
down_revision = "f8e9a0b1c2d3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "partners",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=128), nullable=False),
        sa.Column("destination_url_template", sa.Text(), nullable=False),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("step_id", sa.String(length=64), nullable=False),
        sa.Column("payout_per_conversion", sa.Numeric(12, 2), nullable=False),
        sa.Column("assumed_conversion_rate", sa.Numeric(8, 6), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_partners_slug"), "partners", ["slug"], unique=True)
    op.create_index(op.f("ix_partners_step_id"), "partners", ["step_id"], unique=False)
    op.create_index(op.f("ix_partners_is_active"), "partners", ["is_active"], unique=False)
    op.create_index("idx_partners_step_active", "partners", ["step_id", "is_active"], unique=False)

    op.create_table(
        "rev_share_links",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("partner_id", sa.String(length=36), nullable=False),
        sa.Column("agent_id", sa.String(length=36), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["agent_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["partner_id"], ["partners.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("partner_id", "agent_id", name="uq_rev_share_links_partner_agent"),
    )
    op.create_index(
        op.f("ix_rev_share_links_partner_id"), "rev_share_links", ["partner_id"], unique=False
    )
    op.create_index(
        op.f("ix_rev_share_links_agent_id"), "rev_share_links", ["agent_id"], unique=False
    )
    op.create_index(
        op.f("ix_rev_share_links_is_active"), "rev_share_links", ["is_active"], unique=False
    )
    op.create_index(
        "idx_rev_share_links_partner_agent_active",
        "rev_share_links",
        ["partner_id", "agent_id", "is_active"],
        unique=False,
    )

    op.create_table(
        "buyer_step_views",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("buyer_id", sa.String(length=36), nullable=False),
        sa.Column("step_id", sa.String(length=64), nullable=False),
        sa.Column("transaction_id", sa.String(length=36), nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "buyer_id",
            "step_id",
            "transaction_id",
            name="uq_buyer_step_views_buyer_step_tx",
        ),
    )
    op.create_index(
        op.f("ix_buyer_step_views_buyer_id"), "buyer_step_views", ["buyer_id"], unique=False
    )
    op.create_index(
        op.f("ix_buyer_step_views_step_id"), "buyer_step_views", ["step_id"], unique=False
    )
    op.create_index(
        op.f("ix_buyer_step_views_transaction_id"),
        "buyer_step_views",
        ["transaction_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_buyer_step_views_viewed_at"), "buyer_step_views", ["viewed_at"], unique=False
    )
    op.create_index(
        "idx_buyer_step_views_step_viewed",
        "buyer_step_views",
        ["step_id", "viewed_at"],
        unique=False,
    )

    op.create_table(
        "rev_share_link_clicks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("partner_id", sa.String(length=36), nullable=False),
        sa.Column("link_id", sa.String(length=36), nullable=False),
        sa.Column("agent_id", sa.String(length=36), nullable=False),
        sa.Column("buyer_id", sa.String(length=36), nullable=True),
        sa.Column("transaction_id", sa.String(length=36), nullable=True),
        sa.Column("step_id", sa.String(length=64), nullable=False),
        sa.Column("clicked_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address_hash", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("utm_source", sa.String(length=128), nullable=True),
        sa.Column("utm_medium", sa.String(length=128), nullable=True),
        sa.Column("utm_campaign", sa.String(length=128), nullable=True),
        sa.Column("geo_city", sa.String(length=128), nullable=True),
        sa.Column("geo_zip", sa.String(length=32), nullable=True),
        sa.Column("geo_region", sa.String(length=64), nullable=True),
        sa.Column("device_class", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(["agent_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["link_id"], ["rev_share_links.id"]),
        sa.ForeignKeyConstraint(["partner_id"], ["partners.id"]),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_rev_share_link_clicks_partner_id"),
        "rev_share_link_clicks",
        ["partner_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rev_share_link_clicks_link_id"),
        "rev_share_link_clicks",
        ["link_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rev_share_link_clicks_agent_id"),
        "rev_share_link_clicks",
        ["agent_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rev_share_link_clicks_buyer_id"),
        "rev_share_link_clicks",
        ["buyer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rev_share_link_clicks_transaction_id"),
        "rev_share_link_clicks",
        ["transaction_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rev_share_link_clicks_step_id"),
        "rev_share_link_clicks",
        ["step_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rev_share_link_clicks_clicked_at"),
        "rev_share_link_clicks",
        ["clicked_at"],
        unique=False,
    )
    op.create_index(
        "idx_rev_share_clicks_partner_clicked",
        "rev_share_link_clicks",
        ["partner_id", "clicked_at"],
        unique=False,
    )
    op.create_index(
        "idx_rev_share_clicks_step_clicked",
        "rev_share_link_clicks",
        ["step_id", "clicked_at"],
        unique=False,
    )


def downgrade():
    op.drop_index("idx_rev_share_clicks_step_clicked", table_name="rev_share_link_clicks")
    op.drop_index("idx_rev_share_clicks_partner_clicked", table_name="rev_share_link_clicks")
    op.drop_index(op.f("ix_rev_share_link_clicks_clicked_at"), table_name="rev_share_link_clicks")
    op.drop_index(op.f("ix_rev_share_link_clicks_step_id"), table_name="rev_share_link_clicks")
    op.drop_index(
        op.f("ix_rev_share_link_clicks_transaction_id"), table_name="rev_share_link_clicks"
    )
    op.drop_index(op.f("ix_rev_share_link_clicks_buyer_id"), table_name="rev_share_link_clicks")
    op.drop_index(op.f("ix_rev_share_link_clicks_agent_id"), table_name="rev_share_link_clicks")
    op.drop_index(op.f("ix_rev_share_link_clicks_link_id"), table_name="rev_share_link_clicks")
    op.drop_index(op.f("ix_rev_share_link_clicks_partner_id"), table_name="rev_share_link_clicks")
    op.drop_table("rev_share_link_clicks")

    op.drop_index("idx_buyer_step_views_step_viewed", table_name="buyer_step_views")
    op.drop_index(op.f("ix_buyer_step_views_viewed_at"), table_name="buyer_step_views")
    op.drop_index(op.f("ix_buyer_step_views_transaction_id"), table_name="buyer_step_views")
    op.drop_index(op.f("ix_buyer_step_views_step_id"), table_name="buyer_step_views")
    op.drop_index(op.f("ix_buyer_step_views_buyer_id"), table_name="buyer_step_views")
    op.drop_table("buyer_step_views")

    op.drop_index("idx_rev_share_links_partner_agent_active", table_name="rev_share_links")
    op.drop_index(op.f("ix_rev_share_links_is_active"), table_name="rev_share_links")
    op.drop_index(op.f("ix_rev_share_links_agent_id"), table_name="rev_share_links")
    op.drop_index(op.f("ix_rev_share_links_partner_id"), table_name="rev_share_links")
    op.drop_table("rev_share_links")

    op.drop_index("idx_partners_step_active", table_name="partners")
    op.drop_index(op.f("ix_partners_is_active"), table_name="partners")
    op.drop_index(op.f("ix_partners_step_id"), table_name="partners")
    op.drop_index(op.f("ix_partners_slug"), table_name="partners")
    op.drop_table("partners")
