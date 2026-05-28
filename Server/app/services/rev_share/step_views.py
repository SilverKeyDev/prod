"""Record buyer step views (CTR denominator)."""

from __future__ import annotations

from app import db
from app.models import BuyerStepView

from .transaction_resolve import resolve_transaction


def record_buyer_step_view(
    *,
    buyer_id: str,
    step_id: str,
    transaction_id: str,
) -> tuple[BuyerStepView | None, bool]:
    """Idempotent: one row per (buyer, step, transaction). Returns (row, created)."""
    tx = resolve_transaction(transaction_id)
    if not tx:
        return None, False
    txn_id = tx.id
    existing = BuyerStepView.query.filter_by(
        buyer_id=buyer_id,
        step_id=step_id,
        transaction_id=txn_id,
    ).first()
    if existing:
        return existing, False

    row = BuyerStepView(
        buyer_id=buyer_id,
        step_id=step_id,
        transaction_id=txn_id,
    )
    db.session.add(row)
    db.session.commit()
    return row, True
