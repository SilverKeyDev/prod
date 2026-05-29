"""Drop legacy tables superseded by normalized schema.

Revision ID: g1a2b3c4d5e6
Revises: d3e4f5a6b7c8
Create Date: 2026-05-28

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "g1a2b3c4d5e6"
down_revision = "d3e4f5a6b7c8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_search_session_user_id")
    op.execute("DROP INDEX IF EXISTS ix_user_calendar_connections_user_id")

    for table in (
        "search_session",
        "user_integrations",
        "user_calendar_connections",
        "user_admin",
        "home_likes",
        "home_universal",
    ):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")

    with op.batch_alter_table("user_google_tokens", schema=None) as batch_op:
        batch_op.drop_column("has_calendar_calendarlist_readonly")
        batch_op.drop_column("has_calendar_events_freebusy")


def downgrade() -> None:
    with op.batch_alter_table("user_google_tokens", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "has_calendar_calendarlist_readonly",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            )
        )
        batch_op.add_column(
            sa.Column(
                "has_calendar_events_freebusy",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            )
        )

    op.create_table(
        "home_universal",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("is_liked", sa.Boolean(), server_default=sa.text("false"), nullable=True),
        sa.Column("current", sa.Boolean(), server_default=sa.text("true"), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=64), nullable=True),
        sa.Column("zipcode", sa.String(length=32), nullable=True),
        sa.Column("beds", sa.String(length=36), nullable=True),
        sa.Column("baths", sa.String(length=36), nullable=True),
        sa.Column("sqft", sa.String(length=36), nullable=True),
        sa.Column("lot_size", sa.String(length=36), nullable=True),
        sa.Column("price", sa.String(length=36), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("image_urls", sa.JSON(), nullable=True),
        sa.Column("zpid", sa.String(length=64), nullable=True),
        sa.Column("mls_home_id", sa.String(length=64), nullable=True),
        sa.Column("listing_status", sa.String(length=64), nullable=True),
        sa.Column("property_type", sa.String(length=64), nullable=True),
        sa.Column("home_type", sa.String(length=64), nullable=True),
        sa.Column("year_built", sa.String(length=16), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "home_likes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("is_liked", sa.Boolean(), nullable=True),
        sa.Column("like_history", sa.JSON(), nullable=True),
        sa.Column("zpid", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_admin",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "user_calendar_connections",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("calendar_id", sa.String(length=255), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_integrations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "search_session",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
