"""Unified task checklist API: GET/PUT return items (definitions) + checkedIds (user progress)."""

import uuid

from flask import Blueprint, jsonify, request

from app.schemas import (
    ChecklistTypeQueryParams,
    TaskChecklistApiResponse,
    UpdateTaskChecklistRequest,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_request, validate_response

from ..services.transactions.checklist_support.checklist_constants import coerce_checklist_type
from ..services.transactions.unified_task_checklist_progress_summary import (
    build_task_checklist_progress_summary,
)
from ..services.transactions.unified_task_checklist_read import (
    TASK_CATEGORIES,
    build_task_checklist_data,
)
from ..services.transactions.unified_task_checklist_write import perform_task_checklist_put
from ..utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/v1/tasks")


@tasks_bp.route("", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(ChecklistTypeQueryParams)
def get_task_checklist(user, query: ChecklistTypeQueryParams | None = None):
    """GET /api/v1/tasks?type=escrow|financing|closing|insurance. Returns items (definitions) + checkedIds."""
    checklist_type = coerce_checklist_type(
        (query.type if query is not None else None) or request.args.get("type")
    )
    data = build_task_checklist_data(str(user.id), checklist_type)
    if data is None:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400

    return jsonify({"success": True, "data": data})


@tasks_bp.route("/progress-summary", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_task_checklist_progress_summary(user):
    """GET /api/v1/tasks/progress-summary — per-category counts + overall journey progress."""
    data = build_task_checklist_progress_summary(str(user.id))
    return jsonify({"success": True, "data": data})


@tasks_bp.route("", methods=["PUT"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(ChecklistTypeQueryParams)
@validate_request(UpdateTaskChecklistRequest)
@validate_response(TaskChecklistApiResponse)
def put_task_checklist(
    user,
    data: UpdateTaskChecklistRequest | None = None,
    query: ChecklistTypeQueryParams | None = None,
):
    """PUT /api/v1/tasks?type=... Body (OpenAPI): {\"data\": {\"items\": [], \"checkedIds\": number[]}}. Legacy flat {\"checkedIds\": []} is coerced in validation."""
    checklist_type = coerce_checklist_type(
        (query.type if query is not None else None) or request.args.get("type")
    )
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

        coerced = [int(x) for x in ids if isinstance(x, int | float)]
        correlation_id = (request.headers.get("X-Request-ID") or "").strip() or str(uuid.uuid4())
        payload, _merge_diag = perform_task_checklist_put(
            subject_user_id=str(user.id),
            checklist_type=checklist_type,
            coerced_ids=coerced,
            actor_user_id=str(user.id),
            correlation_id=correlation_id,
        )
        return jsonify(payload)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        from flask import current_app

        current_app.logger.error("Failed to update %s checklist: %s", checklist_type, e)
        return jsonify({"success": False, "error": "Server error"}), 500
