"""Assemble unified task checklist GET payload (definitions + checkedIds) for any subject user."""

from __future__ import annotations

from app import db
from app.models import TransactionTask
from app.services.transactions.checklist_signature_completion import (
    apply_signature_based_checked_ids,
)
from app.services.transactions.checklist_support.checklist_constants import TASK_CATEGORIES
from app.services.transactions.checklist_support.checklist_rules import (
    merge_task_checklist_checked_ids,
)
from app.services.transactions.retrieval import (
    get_checklist_definition,
    get_series_metadata,
    normalize_checklist_items_for_api,
)


def replace_checked_ids_for_user(user_id: str, category: str, ids: list[int]) -> None:
    """Replace all TransactionTask rows for user_id+category with one row per checked template id."""
    user_id = str(user_id)
    TransactionTask.query.filter_by(user_id=user_id, category=category).delete()
    for i, tid in enumerate(ids):
        try:
            template_id = int(tid) if not isinstance(tid, int | float) else int(tid)
        except (TypeError, ValueError):
            continue
        db.session.add(
            TransactionTask(
                user_id=user_id,
                category=category,
                title=f"Item {template_id}",
                status="done",
                order_index=i,
                task_metadata={"templateId": template_id},
            )
        )
    db.session.commit()


def get_checked_ids_for_user(user_id: str, category: str) -> list[int]:
    """Return checked item IDs from TransactionTask rows for user_id + category."""
    tasks = TransactionTask.query.filter_by(user_id=str(user_id), category=category).all()
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
    subject_user_id: str,
    checklist_type: str,
    *,
    actor_user_id: str | None = None,
) -> dict | None:
    """
    Build the `data` object for GET task checklist responses.
    Returns None if checklist_type is invalid.

    When actor_user_id differs from subject_user_id (agent viewing a client checklist),
    signature-based steps reflect stored progress only — agents may override via PUT.
    """
    if checklist_type not in TASK_CATEGORIES:
        return None
    items = get_checklist_definition(checklist_type)
    raw_checked = get_checked_ids_for_user(str(subject_user_id), checklist_type)
    old_set = {int(x) for x in raw_checked}
    pre_signature = merge_task_checklist_checked_ids(items, raw_checked, old_set)
    checked_set = set(pre_signature)
    enforce_signature = actor_user_id is None or str(actor_user_id) == str(subject_user_id)
    if enforce_signature:
        apply_signature_based_checked_ids(items, str(subject_user_id), checklist_type, checked_set)
    checked_ids = sorted(checked_set)
    if enforce_signature and checked_ids != sorted(pre_signature):
        replace_checked_ids_for_user(str(subject_user_id), checklist_type, checked_ids)
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


def recompute_and_persist_buyer_checklist(buyer_user_id: str, category: str) -> None:
    """Re-merge stored checklist rows with rules and signature-based completion, then persist."""
    if category not in TASK_CATEGORIES:
        return
    items = get_checklist_definition(category)
    raw_checked = get_checked_ids_for_user(str(buyer_user_id), category)
    old_set = {int(x) for x in raw_checked}
    merged = set(merge_task_checklist_checked_ids(items, raw_checked, old_set))
    apply_signature_based_checked_ids(items, str(buyer_user_id), category, merged)
    replace_checked_ids_for_user(str(buyer_user_id), category, sorted(merged))
