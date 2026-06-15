"""Aggregate checklist progress counts across all pipeline categories for one transaction."""

from __future__ import annotations

from app.services.transactions.checklist_support.checklist_constants import PIPELINE_ORDER
from app.services.transactions.ensure import ensure_transaction
from app.services.transactions.unified_task_checklist_read import build_task_checklist_data


def _section_progress(data: dict) -> dict:
    items = data.get("items") or []
    checked_ids = data.get("checkedIds") or []
    total = len(items)
    completed = len(checked_ids)
    return {
        "completed": completed,
        "total": total,
        "isComplete": total > 0 and completed >= total,
    }


def build_task_checklist_progress_summary(transaction_id: str) -> dict:
    sections: dict[str, dict] = {}
    overall_completed = 0
    overall_total = 0

    for category in PIPELINE_ORDER:
        data = build_task_checklist_data(str(transaction_id), category)
        if data is None:
            continue
        progress = _section_progress(data)
        sections[str(category)] = progress
        overall_completed += progress["completed"]
        overall_total += progress["total"]

    percent = round((overall_completed / overall_total) * 100) if overall_total > 0 else 0

    return {
        "sections": sections,
        "overall": {
            "completed": overall_completed,
            "total": overall_total,
            "percent": percent,
        },
    }


def build_task_checklist_progress_summary_for_buyer(buyer_user_id: str) -> dict:
    tx = ensure_transaction(buyer_id=str(buyer_user_id))
    return build_task_checklist_progress_summary(tx.id)
