"""Clear per-user checklist progress without deleting transaction rows."""

from __future__ import annotations

from sqlalchemy import delete

from app import db
from app.models import BuyerStepView, TransactionAddress, TransactionTask, User
from app.services.transactions.ensure import transaction_for_buyer


def clear_checklist_progress_for_user(user_id: str, user: User) -> None:
    """Remove checklist progress, saved address, and step views."""
    uid = str(user_id).strip()
    tx = transaction_for_buyer(uid)

    if tx:
        db.session.execute(delete(TransactionTask).where(TransactionTask.transaction_id == tx.id))
        db.session.execute(
            delete(TransactionAddress).where(TransactionAddress.transaction_id == tx.id)
        )
    else:
        db.session.execute(delete(TransactionTask).where(TransactionTask.user_id == uid))
        db.session.execute(delete(TransactionAddress).where(TransactionAddress.user_id == uid))
    db.session.execute(delete(BuyerStepView).where(BuyerStepView.buyer_id == uid))
    db.session.add(user)
