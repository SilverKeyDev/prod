"""Unified task checklist API: GET/PUT return items (definitions) + checkedIds (user progress)."""

from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request

from app.schemas import TaskChecklistApiResponse, UpdateTaskChecklistRequest
from app.utils.validation import validate_request, validate_response

from .. import db
from ..models import TransactionTask
from ..services.transactions.retrieval import get_checklist_definition, get_series_metadata
from ..utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from ..utils.security.security import rate_limit

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/v1/tasks")

# Categories supported by the unified route (search, offer, close checklists)
TASK_CATEGORIES = frozenset({"search", "offer", "escrow", "financing", "closing", "insurance"})


def _get_checked_ids(user_id, category):
    """Return list of checked item IDs from TransactionTask rows for user_id + category."""
    tasks = TransactionTask.query.filter_by(user_id=str(user_id), category=category).all()
    ids = []
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


def _set_checked_ids(user_id, category, ids):
    """Replace all TransactionTask rows for user_id+category with one row per checked ID."""
    if not isinstance(ids, list):
        raise ValueError("Expected list")
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


@tasks_bp.route("", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_task_checklist(user):
    """GET /api/v1/tasks?type=escrow|financing|closing|insurance. Returns items (definitions) + checkedIds."""
    checklist_type = request.args.get("type", "escrow")
    if checklist_type not in TASK_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400

    items = get_checklist_definition(checklist_type)
    checked_ids = _get_checked_ids(user.id, checklist_type)
    metadata = get_series_metadata(checklist_type)

    return jsonify(
        {
            "success": True,
            "data": {
                "items": items,
                "checkedIds": checked_ids,
                "title": metadata.get("title"),
                "subtitle": metadata.get("subtitle"),
                "deadline": metadata.get("deadline"),
                "date_finished": metadata.get("date_finished"),
            },
        }
    )


@tasks_bp.route("", methods=["PUT"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateTaskChecklistRequest)
@validate_response(TaskChecklistApiResponse)
def put_task_checklist(user, data: UpdateTaskChecklistRequest | None = None):
    """PUT /api/v1/tasks?type=... Body: { \"checkedIds\": number[] }. Updates user progress."""
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

        old_ids = set(_get_checked_ids(user.id, checklist_type))
        new_ids = {int(x) for x in ids if isinstance(x, int | float)}
        newly_checked = new_ids - old_ids

        _set_checked_ids(user.id, checklist_type, ids)

        checkoff_time = datetime.now(timezone.utc)
        items = get_checklist_definition(checklist_type)

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

        metadata = get_series_metadata(checklist_type)
        return jsonify(
            {
                "success": True,
                "data": {
                    "items": items,
                    "checkedIds": ids,
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
