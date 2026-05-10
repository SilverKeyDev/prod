"""Unified task checklist API: GET/PUT return items (definitions) + checkedIds (user progress)."""

from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request

from app.schemas import TaskChecklistApiResponse, UpdateTaskChecklistRequest
from app.utils.validation import validate_request, validate_response

from ..services.transactions.checklist_signature_completion import (
    apply_signature_based_checked_ids,
    run_signature_step_auto_send,
)
from ..services.transactions.checklist_support.checklist_rules import (
    merge_task_checklist_checked_ids,
)
from ..services.transactions.retrieval import (
    get_checklist_definition,
    get_series_metadata,
    normalize_checklist_items_for_api,
)
from ..services.transactions.unified_task_checklist_read import (
    TASK_CATEGORIES,
    build_task_checklist_data,
    get_checked_ids_for_user,
    replace_checked_ids_for_user,
)
from ..utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from ..utils.security.security import rate_limit

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/v1/tasks")


@tasks_bp.route("", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_task_checklist(user):
    """GET /api/v1/tasks?type=escrow|financing|closing|insurance. Returns items (definitions) + checkedIds."""
    checklist_type = request.args.get("type", "escrow")
    data = build_task_checklist_data(str(user.id), checklist_type)
    if data is None:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400

    return jsonify({"success": True, "data": data})


@tasks_bp.route("", methods=["PUT"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateTaskChecklistRequest)
@validate_response(TaskChecklistApiResponse)
def put_task_checklist(user, data: UpdateTaskChecklistRequest | None = None):
    """PUT /api/v1/tasks?type=... Body (OpenAPI): {\"data\": {\"items\": [], \"checkedIds\": number[]}}. Legacy flat {\"checkedIds\": []} is coerced in validation."""
    checklist_type = request.args.get("type", "escrow")
    if checklist_type not in TASK_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400

    try:
        if data is None:
            request_data = request.get_json(silent=True)
            if not isinstance(request_data, dict):
                return jsonify({"success": False, "error": "Expected JSON object"}), 400
            ids = request_data.get("checkedIds")
        else:
            payload = data.model_dump()
            inner = payload.get("data") or {}
            ids = inner.get("checkedIds")
        if not isinstance(ids, list):
            return jsonify({"success": False, "error": "checkedIds must be an array"}), 400

        items = get_checklist_definition(checklist_type)
        old_ids = {int(x) for x in get_checked_ids_for_user(str(user.id), checklist_type)}
        coerced = [int(x) for x in ids if isinstance(x, int | float)]
        effective_ids = merge_task_checklist_checked_ids(items, coerced, old_ids)
        effective_set = set(effective_ids)
        apply_signature_based_checked_ids(items, str(user.id), checklist_type, effective_set)
        effective_ids = sorted(effective_set)
        run_signature_step_auto_send(
            buyer_user_id=str(user.id),
            checklist_category=checklist_type,
            effective_checked_ids=set(effective_set),
            items_raw=items,
        )
        newly_checked = effective_set - old_ids

        replace_checked_ids_for_user(user.id, checklist_type, effective_ids)

        checkoff_time = datetime.now(timezone.utc)

        from ..services.transactions import calendar_from_checklist  # Lazy: breaks circular import

        for item_id in newly_checked:
            item = next((i for i in items if i.get("id") == item_id), None)
            if not item:
                continue
            cal = item.get("calendar")
            if not cal or cal.get("hasDates") is True or not cal.get("days"):
                continue
            try:
                calendar_from_checklist.create_calendar_events_for_checklist_item(
                    str(user.id), checklist_type, item_id, checkoff_time
                )
            except Exception as e:
                current_app.logger.warning(
                    "Checklist calendar event creation failed: user=%s type=%s item_id=%s error=%s",
                    user.id,
                    checklist_type,
                    item_id,
                    e,
                )

        from ..services.transactions import checklist_dispatch_automation

        checklist_dispatch_automation.run_checklist_dispatch_for_newly_checked(
            buyer_user_id=str(user.id),
            checklist_category=checklist_type,
            newly_checked=set(newly_checked),
            items_raw=items,
        )

        metadata = get_series_metadata(checklist_type)
        items_out = normalize_checklist_items_for_api(items)
        return jsonify(
            {
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
        )
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        current_app.logger.error("Failed to update %s checklist: %s", checklist_type, e)
        return jsonify({"success": False, "error": "Server error"}), 500
