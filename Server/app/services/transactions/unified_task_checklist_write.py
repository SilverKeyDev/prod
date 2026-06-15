"""Shared checklist PUT pipeline for buyer self-serve and agent-on-client updates."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app.services.transactions.checklist_signature_completion import (
    apply_signature_based_checked_ids,
    run_signature_step_auto_send,
)
from app.services.transactions.checklist_support.checklist_rules import (
    TaskChecklistMergeResult,
    apply_task_checklist_merge,
)
from app.services.transactions.ensure import ensure_transaction
from app.services.transactions.retrieval import (
    get_checklist_definition,
    get_series_metadata,
    normalize_checklist_items_for_api,
)
from app.services.transactions.unified_task_checklist_read import (
    get_checked_ids_for_transaction,
    replace_checked_ids_for_transaction,
)
from logger import log


def log_checklist_put_outcome(
    *,
    correlation_id: str,
    actor_user_id: str,
    transaction_id: str,
    buyer_user_id: str,
    checklist_type: str,
    merge_diag: TaskChecklistMergeResult,
    final_checked_ids: list[int],
    newly_checked: set[int],
) -> None:
    log.info(
        "API",
        "checklist_put",
        {
            "correlation_id": correlation_id,
            "actor_user_id": str(actor_user_id),
            "transaction_id": str(transaction_id),
            "buyer_user_id": str(buyer_user_id),
            "checklist_type": checklist_type,
            "requested_stripped_ids": merge_diag.stripped_requested_ids,
            "stripped_reason_codes": merge_diag.stripped_reason_codes,
            "final_checked_ids": final_checked_ids,
            "newly_checked_count": len(newly_checked),
        },
    )


def perform_task_checklist_put(
    *,
    transaction_id: str,
    checklist_type: str,
    coerced_ids: list[int],
    actor_user_id: str,
    correlation_id: str,
) -> tuple[dict[str, Any], TaskChecklistMergeResult]:
    from app import db
    from app.models import Transaction

    tx = db.session.scalar(select(Transaction).where(Transaction.id == str(transaction_id)))
    if tx is None or not tx.buyer_id:
        raise ValueError("Transaction not found")
    buyer_user_id = str(tx.buyer_id)

    items = get_checklist_definition(checklist_type)
    old_ids = {int(x) for x in get_checked_ids_for_transaction(str(transaction_id), checklist_type)}
    bypass_progress_gates = str(actor_user_id) != buyer_user_id
    merge_diag = apply_task_checklist_merge(
        items,
        coerced_ids,
        old_ids,
        bypass_progress_gates=bypass_progress_gates,
    )

    effective_set = set(merge_diag.effective_ids)
    if not bypass_progress_gates:
        apply_signature_based_checked_ids(
            items,
            buyer_user_id,
            checklist_type,
            effective_set,
            transaction_id=str(transaction_id),
        )
    effective_ids = sorted(effective_set)
    run_signature_step_auto_send(
        buyer_user_id=buyer_user_id,
        checklist_category=checklist_type,
        effective_checked_ids=set(effective_set),
        items_raw=items,
        transaction_id=str(transaction_id),
    )
    newly_checked = effective_set - old_ids

    replace_checked_ids_for_transaction(str(transaction_id), checklist_type, effective_ids)

    checkoff_time = datetime.now(timezone.utc)

    from app.services.transactions import calendar_from_checklist

    for item_id in newly_checked:
        item = next((i for i in items if i.get("id") == item_id), None)
        if not item:
            continue
        cal = item.get("calendar")
        if not cal or cal.get("hasDates") is True or not cal.get("days"):
            continue
        try:
            calendar_from_checklist.create_calendar_events_for_checklist_item(
                buyer_user_id, checklist_type, item_id, checkoff_time
            )
        except Exception as e:
            log.warn(
                "CHECKLISTS",
                "Checklist calendar event creation failed",
                {
                    "transaction_id": transaction_id,
                    "checklist_type": checklist_type,
                    "item_id": item_id,
                    "error": str(e),
                },
            )

    from app.services.transactions import checklist_dispatch_automation

    checklist_dispatch_automation.run_checklist_dispatch_for_newly_checked(
        buyer_user_id=buyer_user_id,
        checklist_category=checklist_type,
        newly_checked=set(newly_checked),
        items_raw=items,
    )

    log_checklist_put_outcome(
        correlation_id=correlation_id,
        actor_user_id=actor_user_id,
        transaction_id=str(transaction_id),
        buyer_user_id=buyer_user_id,
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


def perform_task_checklist_put_for_buyer(
    *,
    buyer_user_id: str,
    checklist_type: str,
    coerced_ids: list[int],
    actor_user_id: str,
    correlation_id: str,
) -> tuple[dict[str, Any], TaskChecklistMergeResult]:
    tx = ensure_transaction(buyer_id=str(buyer_user_id))
    return perform_task_checklist_put(
        transaction_id=tx.id,
        checklist_type=checklist_type,
        coerced_ids=coerced_ids,
        actor_user_id=actor_user_id,
        correlation_id=correlation_id,
    )
