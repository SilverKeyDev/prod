"""Assemble unified task checklist GET payload (definitions + checkedIds) per transaction."""

from __future__ import annotations

from sqlalchemy import delete, select

from app import db
from app.models import Transaction, TransactionTask
from app.services.transactions.checklist_signature_completion import (
    apply_signature_based_checked_ids,
)
from app.services.transactions.checklist_support.checklist_constants import TASK_CATEGORIES
from app.services.transactions.checklist_support.checklist_rules import (
    merge_task_checklist_checked_ids,
)
from app.services.transactions.ensure import ensure_transaction
from app.services.transactions.retrieval import (
    get_checklist_definition,
    get_series_metadata,
    normalize_checklist_items_for_api,
)


def _buyer_id_for_transaction(transaction_id: str) -> str:
    tx = db.session.scalar(select(Transaction).where(Transaction.id == str(transaction_id)))
    if tx is None or not tx.buyer_id:
        raise ValueError(f"Transaction not found: {transaction_id}")
    return str(tx.buyer_id)


def replace_checked_ids_for_transaction(transaction_id: str, category: str, ids: list[int]) -> None:
    """Replace all TransactionTask rows for transaction_id+category."""
    transaction_id = str(transaction_id)
    buyer_id = _buyer_id_for_transaction(transaction_id)
    db.session.execute(
        delete(TransactionTask).where(
            TransactionTask.transaction_id == transaction_id, TransactionTask.category == category
        )
    )
    for i, tid in enumerate(ids):
        try:
            template_id = int(tid) if not isinstance(tid, int | float) else int(tid)
        except (TypeError, ValueError):
            continue
        db.session.add(
            TransactionTask(
                transaction_id=transaction_id,
                user_id=buyer_id,
                category=category,
                title=f"Item {template_id}",
                status="done",
                order_index=i,
                task_metadata={"templateId": template_id},
            )
        )
    db.session.commit()


def get_checked_ids_for_transaction(transaction_id: str, category: str) -> list[int]:
    tasks = db.session.scalars(
        select(TransactionTask).where(
            TransactionTask.transaction_id == str(transaction_id),
            TransactionTask.category == category,
        )
    ).all()
    ids: list[int] = []
    for t in tasks:
        if t.status != "done":
            continue
        meta = t.task_metadata or {}
        tid = meta.get("templateId")
        if tid is not None:
            try:
                ids.append(int(tid))
            except (TypeError, ValueError):
                pass
        elif t.order_index is not None:
            ids.append(int(t.order_index))
    return sorted(ids)


def build_task_checklist_data(
    transaction_id: str,
    checklist_type: str,
    *,
    actor_user_id: str | None = None,
) -> dict | None:
    """
    Build the `data` object for GET task checklist responses.
    Returns None if checklist_type is invalid.
    """
    if checklist_type not in TASK_CATEGORIES:
        return None
    buyer_id = _buyer_id_for_transaction(str(transaction_id))
    items = get_checklist_definition(checklist_type)
    raw_checked = get_checked_ids_for_transaction(str(transaction_id), checklist_type)
    old_set = {int(x) for x in raw_checked}
    pre_signature = merge_task_checklist_checked_ids(items, raw_checked, old_set)
    checked_set = set(pre_signature)
    enforce_signature = actor_user_id is None or str(actor_user_id) == buyer_id
    if enforce_signature:
        apply_signature_based_checked_ids(
            items,
            buyer_id,
            checklist_type,
            checked_set,
            transaction_id=str(transaction_id),
        )
    checked_ids = sorted(checked_set)
    if enforce_signature and checked_ids != sorted(pre_signature):
        replace_checked_ids_for_transaction(str(transaction_id), checklist_type, checked_ids)
    metadata = get_series_metadata(checklist_type)
    items_out = normalize_checklist_items_for_api(items)
    return {
        "items": items_out,
        "checkedIds": checked_ids,
        "title": metadata.get("title"),
        "subtitle": metadata.get("subtitle"),
        "deadline": metadata.get("deadline"),
        "date_finished": metadata.get("date_finished"),
    }


def recompute_and_persist_buyer_checklist(transaction_id: str, category: str) -> None:
    if category not in TASK_CATEGORIES:
        return
    buyer_id = _buyer_id_for_transaction(str(transaction_id))
    items = get_checklist_definition(category)
    raw_checked = get_checked_ids_for_transaction(str(transaction_id), category)
    old_set = {int(x) for x in raw_checked}
    merged = set(merge_task_checklist_checked_ids(items, raw_checked, old_set))
    apply_signature_based_checked_ids(
        items, buyer_id, category, merged, transaction_id=str(transaction_id)
    )
    replace_checked_ids_for_transaction(str(transaction_id), category, sorted(merged))


def build_task_checklist_data_for_buyer(
    buyer_user_id: str,
    checklist_type: str,
    *,
    actor_user_id: str | None = None,
) -> dict | None:
    """Ensure transaction row exists, then build checklist payload."""
    tx = ensure_transaction(buyer_id=str(buyer_user_id))
    return build_task_checklist_data(tx.id, checklist_type, actor_user_id=actor_user_id)
