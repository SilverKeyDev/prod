"""Aggregate checklist progress counts across all pipeline categories for one subject user."""

from __future__ import annotations

from app.services.transactions.checklist_support.checklist_constants import PIPELINE_ORDER
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


def build_task_checklist_progress_summary(subject_user_id: str) -> dict:
    """
    Build per-category and overall checklist progress for a buyer subject.

    Reuses build_task_checklist_data (merge + signature rules) per category.
    """
    sections: dict[str, dict] = {}
    overall_completed = 0
    overall_total = 0

    for category in PIPELINE_ORDER:
        data = build_task_checklist_data(str(subject_user_id), category)
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
