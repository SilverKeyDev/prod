"""Resolve Transaction rows from buyer user id or transaction primary key."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import Transaction


def resolve_transaction(subject_or_transaction_id: str) -> Transaction | None:
    """
    Checklist routes use buyer ``user.id`` as the path ``transaction_id`` segment.
    Accept either that subject id or a real ``transactions.id``.
    """
    key = str(subject_or_transaction_id)
    by_buyer = db.session.scalar(select(Transaction).where(Transaction.buyer_id == key))
    if by_buyer:
        return by_buyer
    return db.session.scalar(select(Transaction).where(Transaction.id == key))
