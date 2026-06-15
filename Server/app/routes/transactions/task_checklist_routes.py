"""Task checklist GET/PUT routes for a transaction."""

import uuid

from flask import jsonify, request

from app.schemas import TaskChecklistApiResponse, UpdateTaskChecklistRequest
from app.schemas.generated import ChecklistTypeQueryParams
from app.services.transactions.access import resolve_authorized_transaction
from app.services.transactions.checklist_support.checklist_constants import coerce_checklist_type
from app.services.transactions.unified_task_checklist_progress_summary import (
    build_task_checklist_progress_summary,
)
from app.services.transactions.unified_task_checklist_read import (
    TASK_CATEGORIES,
    build_task_checklist_data,
)
from app.services.transactions.unified_task_checklist_write import perform_task_checklist_put
from app.utils.common_patterns import (
    forbidden,
    handle_exceptions_with_logging,
    invalid_request,
    not_found,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_request, validate_response

from . import transactions_bp


@transactions_bp.route("/<transaction_id>/tasks", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(ChecklistTypeQueryParams)
def get_transaction_task_checklist(user, transaction_id: str, query: ChecklistTypeQueryParams):
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    checklist_type = coerce_checklist_type(query.type)
    data = build_task_checklist_data(
        tx.id,
        checklist_type,
        actor_user_id=str(user.id),
    )
    if data is None:
        return invalid_request("Invalid checklist type")

    return jsonify({"success": True, "data": data})


@transactions_bp.route("/<transaction_id>/tasks/progress-summary", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_transaction_task_checklist_progress_summary(user, transaction_id: str):
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    data = build_task_checklist_progress_summary(tx.id)
    return jsonify({"success": True, "data": data})


@transactions_bp.route("/<transaction_id>/tasks", methods=["PUT"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(ChecklistTypeQueryParams)
@validate_request(UpdateTaskChecklistRequest)
@validate_response(TaskChecklistApiResponse)
def put_transaction_task_checklist(
    user,
    transaction_id: str,
    data: UpdateTaskChecklistRequest,
    query: ChecklistTypeQueryParams,
):
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

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
        payload, _merge_diag = perform_task_checklist_put(
            transaction_id=tx.id,
            checklist_type=checklist_type,
            coerced_ids=coerced,
            actor_user_id=str(user.id),
            correlation_id=correlation_id,
        )

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "checklist_tasks_updated",
            properties={
                "checklist_type": checklist_type,
                "checked_count": len(coerced),
                "transaction_id": tx.id,
            },
        )

        return jsonify(payload)
    except ValueError as e:
        if str(e) == "Transaction not found":
            return not_found()
        return validation(str(e))
    except Exception as e:
        return server_error(
            e,
            context={
                "function": "put_transaction_task_checklist",
                "transaction_id": transaction_id,
            },
        )
