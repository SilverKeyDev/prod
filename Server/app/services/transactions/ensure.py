"""Get-or-create the single transaction row per buyer (v1 revenue spine)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models import AgentConnections, Transaction
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.brokerage.membership import primary_brokerage_org_id_for_agent


def _first_agent_for_buyer(buyer_id: str) -> str | None:
    conn = db.session.scalar(
        select(AgentConnections)
        .where(AgentConnections.client_id == str(buyer_id))
        .order_by(AgentConnections.created_at.asc())
    )
    return str(conn.agent_id) if conn and conn.agent_id else None


def ensure_transaction(
    *,
    buyer_id: str,
    primary_agent_id: str | None = None,
    brokerage_org_id: str | None = None,
) -> Transaction:
    """Get-or-create the single transaction row for this buyer (v1)."""
    buyer_id = str(buyer_id).strip()
    if not buyer_id:
        raise ValueError("buyer_id is required")

    existing = db.session.scalar(select(Transaction).where(Transaction.buyer_id == buyer_id))
    if existing:
        return existing

    agent_id = primary_agent_id or _first_agent_for_buyer(buyer_id)
    org_id = brokerage_org_id
    if not org_id and agent_id:
        org_id = primary_brokerage_org_id_for_agent(agent_id)
    if not org_id:
        org_id = DEFAULT_BROKERAGE_ORG_ID

    now = datetime.now(timezone.utc)
    tx = Transaction(
        id=str(uuid.uuid4()),
        buyer_id=buyer_id,
        primary_agent_id=agent_id,
        brokerage_org_id=org_id,
        created_at=now,
        updated_at=now,
    )
    db.session.add(tx)
    db.session.flush()
    return tx


def transaction_for_buyer(buyer_id: str) -> Transaction | None:
    return db.session.scalar(select(Transaction).where(Transaction.buyer_id == str(buyer_id)))
