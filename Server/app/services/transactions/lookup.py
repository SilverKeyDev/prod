"""Look up transaction rows by primary key (strict — no buyer-id compat)."""

from __future__ import annotations

from app.models import Transaction


def get_transaction_by_id(transaction_id: str) -> Transaction | None:
    """Return the transaction row when *transaction_id* is ``transactions.id``."""
    key = str(transaction_id).strip()
    if not key:
        return None
    return Transaction.query.filter_by(id=key).first()
