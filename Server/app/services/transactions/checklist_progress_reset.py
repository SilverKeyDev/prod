"""Clear per-user checklist progress without deleting transaction rows."""

from __future__ import annotations

from app import db
from app.models import BuyerStepView, TransactionAddress, TransactionTask, User


def clear_checklist_progress_for_user(user_id: str, user: User) -> None:
    """Remove checklist progress, saved address, legacy columns, and step views."""
    uid = str(user_id).strip()

    TransactionTask.query.filter_by(user_id=uid).delete(synchronize_session=False)
    TransactionAddress.query.filter_by(user_id=uid).delete(synchronize_session=False)
    BuyerStepView.query.filter_by(buyer_id=uid).delete(synchronize_session=False)

    user.timeline_checklist = None
    user.escrow_checklist = None
    user.financing_checklist = None
    user.closing_checklist = None
    user.insurance_checklist = None
    db.session.add(user)
