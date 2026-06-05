"""Resolve or create the buyer's active transaction (Option B selection layer)."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import Transaction
from app.services.transactions.selection import resolve_active_transaction


def ensure_transaction(
    *,
    buyer_id: str,
    primary_agent_id: str | None = None,
    brokerage_org_id: str | None = None,
) -> Transaction:
    """Return the buyer's active deal, creating the first row when none exist."""
    del primary_agent_id, brokerage_org_id  # preserved for call-site compatibility
    return resolve_active_transaction(str(buyer_id))


def transaction_for_buyer(buyer_id: str) -> Transaction | None:
    """Latest deal for buyer (legacy helper); prefer resolve_active_transaction."""
    return db.session.scalar(
        select(Transaction)
        .where(Transaction.buyer_id == str(buyer_id))
        .order_by(Transaction.updated_at.desc())
    )
