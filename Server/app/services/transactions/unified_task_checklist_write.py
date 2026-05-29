"""Shared checklist PUT pipeline for buyer self-serve and agent-on-client updates."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from flask import current_app

from app.services.transactions.checklist_signature_completion import (
    apply_signature_based_checked_ids,
    run_signature_step_auto_send,
)
from app.services.transactions.checklist_support.checklist_rules import (
    TaskChecklistMergeResult,
    apply_task_checklist_merge,
)
from app.services.transactions.retrieval import (
    get_checklist_definition,
    get_series_metadata,
    normalize_checklist_items_for_api,
)
from app.services.transactions.unified_task_checklist_read import (
    get_checked_ids_for_user,
    replace_checked_ids_for_user,
)
from logger import LOG_CATEGORIES, log


def log_checklist_put_outcome(
    *,
    correlation_id: str,
    actor_user_id: str,
    subject_user_id: str,
    checklist_type: str,
    merge_diag: TaskChecklistMergeResult,
    final_checked_ids: list[int],
    newly_checked: set[int],
) -> None:
    """Structured, PII-safe checklist mutation log for pilot debugging."""
    log.info(
        LOG_CATEGORIES["API"],
        "checklist_put",
        {
            "correlation_id": correlation_id,
            "actor_user_id": str(actor_user_id),
            "subject_user_id": str(subject_user_id),
            "checklist_type": checklist_type,
            "requested_stripped_ids": merge_diag.stripped_requested_ids,
            "stripped_reason_codes": merge_diag.stripped_reason_codes,
            "final_checked_ids": final_checked_ids,
            "newly_checked_count": len(newly_checked),
        },
    )


def perform_task_checklist_put(
    *,
    subject_user_id: str,
    checklist_type: str,
    coerced_ids: list[int],
    actor_user_id: str,
    correlation_id: str,
) -> tuple[dict[str, Any], TaskChecklistMergeResult]:
    """
    Apply merge + signature enrichment, persist TransactionTask rows, calendar hooks,
    and dispatch automation. Returns (success payload dict for `data` key, merge diagnostics).

    Concurrency: there is no row-level versioning; concurrent PUTs run independent merges
    over the prior DB state, and `replace_checked_ids_for_user` is last-write-wins for
    the subject's checklist category.
    """
    items = get_checklist_definition(checklist_type)
    old_ids = {int(x) for x in get_checked_ids_for_user(str(subject_user_id), checklist_type)}
    bypass_progress_gates = str(actor_user_id) != str(subject_user_id)
    merge_diag = apply_task_checklist_merge(
        items,
        coerced_ids,
        old_ids,
        bypass_progress_gates=bypass_progress_gates,
    )

    effective_set = set(merge_diag.effective_ids)
    if not bypass_progress_gates:
        apply_signature_based_checked_ids(
            items, str(subject_user_id), checklist_type, effective_set
        )
    effective_ids = sorted(effective_set)
    run_signature_step_auto_send(
        buyer_user_id=str(subject_user_id),
        checklist_category=checklist_type,
        effective_checked_ids=set(effective_set),
        items_raw=items,
    )
    newly_checked = effective_set - old_ids

    replace_checked_ids_for_user(subject_user_id, checklist_type, effective_ids)

    checkoff_time = datetime.now(timezone.utc)

    from app.services.transactions import calendar_from_checklist  # Lazy: breaks circular import

    for item_id in newly_checked:
        item = next((i for i in items if i.get("id") == item_id), None)
        if not item:
            continue
        cal = item.get("calendar")
        if not cal or cal.get("hasDates") is True or not cal.get("days"):
            continue
        try:
            calendar_from_checklist.create_calendar_events_for_checklist_item(
                str(subject_user_id), checklist_type, item_id, checkoff_time
            )
        except Exception as e:
            current_app.logger.warning(
                "Checklist calendar event creation failed: user=%s type=%s item_id=%s error=%s",
                subject_user_id,
                checklist_type,
                item_id,
                e,
            )

    from app.services.transactions import checklist_dispatch_automation

    checklist_dispatch_automation.run_checklist_dispatch_for_newly_checked(
        buyer_user_id=str(subject_user_id),
        checklist_category=checklist_type,
        newly_checked=set(newly_checked),
        items_raw=items,
    )

    log_checklist_put_outcome(
        correlation_id=correlation_id,
        actor_user_id=actor_user_id,
        subject_user_id=subject_user_id,
        checklist_type=checklist_type,
        merge_diag=merge_diag,
        final_checked_ids=effective_ids,
        newly_checked=newly_checked,
    )

    metadata = get_series_metadata(checklist_type)
    items_out = normalize_checklist_items_for_api(items)
    payload: dict[str, Any] = {
        "success": True,
        "data": {
            "items": items_out,
            "checkedIds": effective_ids,
            "title": metadata.get("title"),
            "subtitle": metadata.get("subtitle"),
            "deadline": metadata.get("deadline"),
            "date_finished": metadata.get("date_finished"),
        },
    }
    return payload, merge_diag
