"""Persist ORM changes for transaction route-facing service calls."""

from app import db


def persist_transaction_session() -> None:
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
