"""Rev-share payout snapshot on clicks/views and click dedupe by session day.

Revision ID: h3c4d5e6f7a8
Revises: g2b3c4d5e6f7
Create Date: 2026-05-29

Best-effort backfill: existing rows get payout fields from the partner's *current*
config and click_date from clicked_at (UTC). Historical rates before this migration
cannot be recovered.
"""

from __future__ import annotations

import json

import sqlalchemy as sa
from alembic import op

revision = "h3c4d5e6f7a8"
down_revision = "g2b3c4d5e6f7"
branch_labels = None
depends_on = None


def _backfill_buyer_step_view_snapshots(conn) -> None:
    partners = conn.execute(
        sa.text(
            """
            SELECT id, step_id, step_ids, payout_type, payout_per_conversion
            FROM partners
            WHERE is_active = true
            """
        )
    ).fetchall()

    def resolved_step_ids(step_id: str | None, step_ids_raw) -> list[str]:
        if step_ids_raw:
            if isinstance(step_ids_raw, str):
                try:
                    parsed = json.loads(step_ids_raw)
                    if isinstance(parsed, list):
                        return [str(s).strip() for s in parsed if str(s).strip()]
                except (json.JSONDecodeError, TypeError):
                    pass
            elif isinstance(step_ids_raw, list):
                return [str(s).strip() for s in step_ids_raw if str(s).strip()]
        if step_id and str(step_id).strip():
            return [str(step_id).strip()]
        return []

    by_step: dict[str, list[dict]] = {}
    for row in partners:
        for sid in resolved_step_ids(row.step_id, row.step_ids):
            by_step.setdefault(sid, []).append(
                {
                    "partner_id": str(row.id),
                    "payout_type": row.payout_type or "on_click",
                    "payout_per_conversion": str(row.payout_per_conversion or "0"),
                }
            )

    views = conn.execute(sa.text("SELECT id, step_id FROM buyer_step_views")).fetchall()
    for view in views:
        snapshot = by_step.get(view.step_id, [])
        conn.execute(
            sa.text(
                """
                UPDATE buyer_step_views
                SET partner_payout_snapshot = :snapshot
                WHERE id = :id
                """
            ),
            {"id": view.id, "snapshot": json.dumps(snapshot)},
        )


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    with op.batch_alter_table("rev_share_link_clicks", schema=None) as batch_op:
        batch_op.add_column(sa.Column("payout_per_conversion", sa.Numeric(12, 2), nullable=True))
        batch_op.add_column(sa.Column("payout_type", sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column("session_id", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("click_date", sa.Date(), nullable=True))

    if dialect == "postgresql":
        op.execute(
            """
            UPDATE rev_share_link_clicks c
            SET payout_per_conversion = p.payout_per_conversion,
                payout_type = COALESCE(p.payout_type, 'on_click'),
                click_date = (c.clicked_at AT TIME ZONE 'UTC')::date
            FROM partners p
            WHERE c.partner_id = p.id
            """
        )
    else:
        op.execute(
            """
            UPDATE rev_share_link_clicks
            SET payout_per_conversion = (
                    SELECT payout_per_conversion FROM partners p
                    WHERE p.id = rev_share_link_clicks.partner_id
                ),
                payout_type = COALESCE(
                    (SELECT payout_type FROM partners p
                     WHERE p.id = rev_share_link_clicks.partner_id),
                    'on_click'
                ),
                click_date = date(clicked_at)
            """
        )

    with op.batch_alter_table("rev_share_link_clicks", schema=None) as batch_op:
        batch_op.alter_column("payout_per_conversion", nullable=False)
        batch_op.alter_column("payout_type", nullable=False)
        batch_op.create_unique_constraint(
            "uq_rev_share_clicks_link_session_day",
            ["link_id", "session_id", "click_date"],
        )

    with op.batch_alter_table("buyer_step_views", schema=None) as batch_op:
        batch_op.add_column(sa.Column("partner_payout_snapshot", sa.JSON(), nullable=True))

    _backfill_buyer_step_view_snapshots(bind)


def downgrade() -> None:
    with op.batch_alter_table("buyer_step_views", schema=None) as batch_op:
        batch_op.drop_column("partner_payout_snapshot")

    with op.batch_alter_table("rev_share_link_clicks", schema=None) as batch_op:
        batch_op.drop_constraint("uq_rev_share_clicks_link_session_day", type_="unique")
        batch_op.drop_column("click_date")
        batch_op.drop_column("session_id")
        batch_op.drop_column("payout_type")
        batch_op.drop_column("payout_per_conversion")
