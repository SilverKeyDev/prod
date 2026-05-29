"""Record buyer step views (CTR denominator)."""

from __future__ import annotations

from app import db
from app.models import BuyerStepView
from app.services.transactions.lookup import get_transaction_by_id

from .partner_steps import list_active_partners_for_step


def build_partner_payout_snapshot(step_id: str) -> list[dict]:
    """Capture active partner payout config at view time (immutable audit)."""
    return [
        {
            "partner_id": p.id,
            "payout_type": p.payout_type or "on_click",
            "payout_per_conversion": str(p.payout_per_conversion or "0"),
        }
        for p in list_active_partners_for_step(step_id)
    ]


def record_buyer_step_view(
    *,
    buyer_id: str,
    step_id: str,
    transaction_id: str,
) -> tuple[BuyerStepView | None, bool]:
    """Idempotent: one row per (buyer, step, transaction). Returns (row, created)."""
    tx = get_transaction_by_id(transaction_id)
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
        partner_payout_snapshot=build_partner_payout_snapshot(step_id),
    )
    db.session.add(row)
    db.session.commit()
    return row, True
