"""Look up transaction rows by primary key (strict — no buyer-id compat)."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import Transaction


def get_transaction_by_id(transaction_id: str) -> Transaction | None:
    """Return the transaction row when *transaction_id* is ``transactions.id``."""
    key = str(transaction_id).strip()
    if not key:
        return None
    return db.session.scalar(select(Transaction).where(Transaction.id == key))
