"""Unified task checklist API: GET/PUT return items (definitions) + checkedIds (user progress)."""

import uuid

from flask import Blueprint, jsonify, request

from app.schemas import (
    ChecklistTypeQueryParams,
    TaskChecklistApiResponse,
    UpdateTaskChecklistRequest,
)
from app.utils.common_patterns import invalid_request, not_found, server_error, validation
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_request, validate_response

from ..services.transactions.checklist_support.checklist_constants import coerce_checklist_type
from ..services.transactions.unified_task_checklist_progress_summary import (
    build_task_checklist_progress_summary_for_buyer,
)
from ..services.transactions.unified_task_checklist_read import (
    TASK_CATEGORIES,
    build_task_checklist_data_for_buyer,
)
from ..services.transactions.unified_task_checklist_write import (
    perform_task_checklist_put_for_buyer,
)
from ..utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/v1/tasks")


@tasks_bp.route("", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(ChecklistTypeQueryParams)
def get_task_checklist(user, query: ChecklistTypeQueryParams):
    checklist_type = coerce_checklist_type(query.type)
    data = build_task_checklist_data_for_buyer(str(user.id), checklist_type)
    if data is None:
        return invalid_request("Invalid checklist type")

    return jsonify({"success": True, "data": data})


@tasks_bp.route("/progress-summary", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_task_checklist_progress_summary(user):
    data = build_task_checklist_progress_summary_for_buyer(str(user.id))
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
    data: UpdateTaskChecklistRequest,
    query: ChecklistTypeQueryParams,
):
    checklist_type = coerce_checklist_type(query.type)
    if checklist_type not in TASK_CATEGORIES:
        return invalid_request("Invalid checklist type")

    try:
        payload = data.model_dump()
        inner = payload.get("data") or {}
        ids = inner.get("checkedIds")
        if not isinstance(ids, list):
            return validation(
                "checkedIds must be an array",
                field_errors={"checkedIds": "Must be an array"},
            )

        coerced = [int(x) for x in ids if isinstance(x, int | float)]
        correlation_id = (request.headers.get("X-Request-ID") or "").strip() or str(uuid.uuid4())
        payload, _merge_diag = perform_task_checklist_put_for_buyer(
            buyer_user_id=str(user.id),
            checklist_type=checklist_type,
            coerced_ids=coerced,
            actor_user_id=str(user.id),
            correlation_id=correlation_id,
        )
        return jsonify(payload)
    except ValueError as e:
        if str(e) == "Transaction not found":
            return not_found()
        return validation(str(e))
    except Exception as e:
        return server_error(e, context={"function": "put_task_checklist"})
