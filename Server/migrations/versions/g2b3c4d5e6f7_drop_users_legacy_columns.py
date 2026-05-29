"""Backfill legacy user data and drop denormalized columns.

Revision ID: g2b3c4d5e6f7
Revises: g1a2b3c4d5e6
Create Date: 2026-05-28

"""

from __future__ import annotations

import json
import uuid

import sqlalchemy as sa
from alembic import op

revision = "g2b3c4d5e6f7"
down_revision = "g1a2b3c4d5e6"
branch_labels = None
depends_on = None

_CHECKLIST_COLUMNS = (
    ("timeline_checklist", "timeline"),
    ("escrow_checklist", "escrow"),
    ("financing_checklist", "financing"),
    ("closing_checklist", "closing"),
    ("insurance_checklist", "insurance"),
    ("inspections_checklist", "inspections"),
)


def _parse_ids(raw: str | None) -> list[int]:
    if not raw or not str(raw).strip():
        return []
    s = str(raw).strip()
    try:
        parsed = json.loads(s)
        if isinstance(parsed, list):
            items = parsed
        else:
            items = [parsed]
    except (json.JSONDecodeError, TypeError):
        items = [p.strip() for p in s.split(",") if p.strip()]
    out: list[int] = []
    for x in items:
        try:
            out.append(int(x) if not isinstance(x, int | float) else int(x))
        except (TypeError, ValueError):
            continue
    return out


def _parse_id_list(raw: str | None) -> list[str]:
    if not raw or not str(raw).strip():
        return []
    s = str(raw).strip()
    try:
        parsed = json.loads(s)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
        if parsed is not None and parsed != "":
            return [str(parsed).strip()]
    except (json.JSONDecodeError, TypeError):
        pass
    return [p.strip() for p in s.split(",") if p.strip()]


def upgrade() -> None:
    conn = op.get_bind()

    # --- Checklist JSON -> user_tasks ---
    users = conn.execute(
        sa.text(
            """
            SELECT id, timeline_checklist, escrow_checklist, financing_checklist,
                   closing_checklist, insurance_checklist, inspections_checklist
            FROM users
            """
        )
    ).fetchall()

    for row in users:
        user_id = str(row.id)
        for col_name, category in _CHECKLIST_COLUMNS:
            raw = getattr(row, col_name, None)
            ids = _parse_ids(raw)
            if not ids:
                continue
            existing = conn.execute(
                sa.text(
                    "SELECT 1 FROM user_tasks WHERE user_id = :uid AND category = :cat LIMIT 1"
                ),
                {"uid": user_id, "cat": category},
            ).first()
            if existing:
                continue
            for i, template_id in enumerate(ids):
                conn.execute(
                    sa.text(
                        """
                        INSERT INTO user_tasks
                            (id, user_id, category, title, status, order_index, metadata, created_at, updated_at)
                        VALUES
                            (:id, :uid, :cat, :title, 'done', :ord, CAST(:meta AS jsonb), NOW(), NOW())
                        """
                    ),
                    {
                        "id": str(uuid.uuid4()),
                        "uid": user_id,
                        "cat": category,
                        "title": f"Item {template_id}",
                        "ord": i,
                        "meta": json.dumps({"templateId": template_id}),
                    },
                )

    # --- is_agent -> user_roles ---
    agents = conn.execute(sa.text("SELECT id FROM users WHERE is_agent = true")).fetchall()
    for row in agents:
        uid = str(row.id)
        exists = conn.execute(
            sa.text("SELECT 1 FROM user_roles WHERE user_id = :uid AND role = 'agent' LIMIT 1"),
            {"uid": uid},
        ).first()
        if not exists:
            conn.execute(
                sa.text(
                    "INSERT INTO user_roles (id, user_id, role, created_at) VALUES (:id, :uid, 'agent', NOW())"
                ),
                {"id": str(uuid.uuid4()), "uid": uid},
            )

    # --- client_ids / agent_id -> agent_conversations ---
    roster_rows = conn.execute(
        sa.text(
            "SELECT id, client_ids FROM users WHERE client_ids IS NOT NULL AND client_ids != ''"
        )
    ).fetchall()
    for row in roster_rows:
        agent_id = str(row.id)
        for client_id in _parse_id_list(row.client_ids):
            exists = conn.execute(
                sa.text(
                    """
                    SELECT 1 FROM agent_conversations
                    WHERE agent_id = :aid AND client_id = :cid LIMIT 1
                    """
                ),
                {"aid": agent_id, "cid": client_id},
            ).first()
            if not exists:
                conn.execute(
                    sa.text(
                        """
                        INSERT INTO agent_conversations (id, agent_id, client_id, created_at, updated_at)
                        VALUES (:id, :aid, :cid, NOW(), NOW())
                        """
                    ),
                    {"id": str(uuid.uuid4()), "aid": agent_id, "cid": client_id},
                )

    buyer_rows = conn.execute(
        sa.text("SELECT id, agent_id FROM users WHERE agent_id IS NOT NULL AND agent_id != ''")
    ).fetchall()
    for row in buyer_rows:
        client_id = str(row.id)
        for agent_id in _parse_id_list(row.agent_id):
            exists = conn.execute(
                sa.text(
                    """
                    SELECT 1 FROM agent_conversations
                    WHERE agent_id = :aid AND client_id = :cid LIMIT 1
                    """
                ),
                {"aid": agent_id, "cid": client_id},
            ).first()
            if not exists:
                conn.execute(
                    sa.text(
                        """
                        INSERT INTO agent_conversations (id, agent_id, client_id, created_at, updated_at)
                        VALUES (:id, :aid, :cid, NOW(), NOW())
                        """
                    ),
                    {"id": str(uuid.uuid4()), "aid": agent_id, "cid": client_id},
                )

    with op.batch_alter_table("users", schema=None) as batch_op:
        for col, _ in _CHECKLIST_COLUMNS:
            batch_op.drop_column(col)
        batch_op.drop_column("is_agent")
        batch_op.drop_column("client_ids")
        batch_op.drop_column("agent_id")


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("agent_id", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("client_ids", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column("is_agent", sa.Boolean(), nullable=True, server_default=sa.text("false"))
        )
        for col, _ in reversed(_CHECKLIST_COLUMNS):
            batch_op.add_column(sa.Column(col, sa.Text(), nullable=True))
