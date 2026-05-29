"""One rev_share link per partner (SilverKey platform placement, not per-agent).

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-05-27

"""

import sqlalchemy as sa
from alembic import op

revision = "d3e4f5a6b7c8"
down_revision = "c2d3e4f5a6b7"
branch_labels = None
depends_on = None


def upgrade():
    # Remove clicks on duplicate links, then duplicate links (keep earliest per partner).
    op.execute(
        """
        DELETE FROM rev_share_link_clicks
        WHERE link_id IN (
            SELECT rl.id
            FROM rev_share_links rl
            INNER JOIN rev_share_links keeper
                ON keeper.partner_id = rl.partner_id
                AND keeper.generated_at < rl.generated_at
        )
        """
    )
    op.execute(
        """
        DELETE FROM rev_share_links rl
        USING rev_share_links keeper
        WHERE rl.partner_id = keeper.partner_id
          AND rl.generated_at > keeper.generated_at
        """
    )

    op.drop_index("idx_rev_share_links_partner_agent_active", table_name="rev_share_links")
    op.drop_constraint("uq_rev_share_links_partner_agent", "rev_share_links", type_="unique")
    op.drop_index(op.f("ix_rev_share_links_agent_id"), table_name="rev_share_links")
    op.drop_column("rev_share_links", "agent_id")

    op.create_unique_constraint("uq_rev_share_links_partner_id", "rev_share_links", ["partner_id"])

    op.alter_column(
        "rev_share_link_clicks",
        "agent_id",
        existing_type=sa.String(length=36),
        nullable=True,
    )


def downgrade():
    op.alter_column(
        "rev_share_link_clicks",
        "agent_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )

    op.drop_constraint("uq_rev_share_links_partner_id", "rev_share_links", type_="unique")

    op.add_column(
        "rev_share_links",
        sa.Column("agent_id", sa.String(length=36), nullable=True),
    )
    op.create_foreign_key(
        "rev_share_links_agent_id_fkey",
        "rev_share_links",
        "users",
        ["agent_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_rev_share_links_agent_id"), "rev_share_links", ["agent_id"], unique=False
    )
    op.create_unique_constraint(
        "uq_rev_share_links_partner_agent",
        "rev_share_links",
        ["partner_id", "agent_id"],
    )
    op.create_index(
        "idx_rev_share_links_partner_agent_active",
        "rev_share_links",
        ["partner_id", "agent_id", "is_active"],
        unique=False,
    )
