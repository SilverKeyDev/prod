from __future__ import annotations

import json
from typing import Any, Protocol, cast

from flask import Blueprint, Response, current_app, jsonify, stream_with_context
from flask import request as req

from app.schemas import PropertyRequest
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.celery_task_ownership import register_task_owner, verify_task_owner
from app.utils.validation import validate_request
from logger import LOG_CATEGORIES, log

from ...celery.celery_worker import celery
from ...celery.tasks import compare_property_task, research_property_task
from ...services.research.property.property_params import build_property_params
from ...utils.security.secure_errors import SecureErrorHandler


class _CeleryTaskWithDelay(Protocol):
    """Protocol for Celery task so Pyright accepts .delay()."""

    def delay(self, **kwargs: Any) -> Any: ...


research_bp = Blueprint("research", __name__, url_prefix="/api/v1/research")


def _forbidden_task_access():
    return jsonify(
        {
            "success": False,
            "error": "FORBIDDEN",
            "message": "Access denied to this task",
        }
    ), 403


@research_bp.route("/property", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(PropertyRequest)
def get_property_via_address(user, data: PropertyRequest | None = None):
    """
    Fetch property detail using exactly one of:
    zpid, property_url, or address (address-only is fine).
    Enhanced with commute map visualization data.
    Supports streaming via ?stream=true query parameter.
    Non-streaming requests are processed via Celery tasks.
    """
    if data is None:
        body = req.get_json(silent=True) or {}
    else:
        body = data.model_dump()
    zpid = body.get("zpid")
    property_url = body.get("property_url")
    address = body.get("address")

    stream_mode = (
        req.args.get("stream", "false").lower() == "true"
        or req.headers.get("X-Stream", "").lower() == "true"
    )

    params = build_property_params(zpid=zpid, property_url=property_url, address=address)
    if params is None:
        return jsonify(
            {
                "success": False,
                "error": "BAD_REQUEST",
                "message": "Provide one of: zpid, property_url, or address",
            }
        ), 400

    if stream_mode:
        from ...services.search.property.property_stream import generate_property_stream

        return Response(
            stream_with_context(generate_property_stream(params, address, research_body=body)),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    task = cast(_CeleryTaskWithDelay, research_property_task).delay(
        params=params, address=address, skip_pros_cons=False, research_body=body
    )
    register_task_owner(task.id, str(user.id))

    return jsonify(
        {
            "success": True,
            "task_id": task.id,
            "status": "PENDING",
            "message": "Property research task has been queued",
        }
    ), 202


@research_bp.route("/compare", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(PropertyRequest)
def compare_property(user, data: PropertyRequest | None = None):
    """
    Compare property endpoint - same as /property but skips pros/cons generation.
    Optimized for comparison use cases where pros/cons are not needed.
    Supports streaming via ?stream=true query parameter.
    Non-streaming requests are processed via Celery tasks.
    """
    if data is None:
        body = req.get_json(silent=True) or {}
    else:
        body = data.model_dump()
    zpid = body.get("zpid")
    property_url = body.get("property_url")
    address = body.get("address")

    current_app.logger.info(
        f"[COMPARE] Request received - zpid: {zpid}, property_url: {property_url}, address: {address}"
    )

    stream_mode = (
        req.args.get("stream", "false").lower() == "true"
        or req.headers.get("X-Stream", "").lower() == "true"
    )

    params = build_property_params(zpid=zpid, property_url=property_url, address=address)
    if params is None:
        error_response = {
            "success": False,
            "error": "BAD_REQUEST",
            "message": "Provide one of: zpid, property_url, or address",
        }
        current_app.logger.warning(
            f"[COMPARE] Invalid request - missing parameters. Full error response: {json.dumps(error_response)}"
        )
        return jsonify(error_response), 400

    if stream_mode:
        current_app.logger.info(
            "[COMPARE] Streaming mode enabled - response will be streamed incrementally"
        )
        from ...services.search.property.property_stream import generate_property_stream_compare

        return Response(
            stream_with_context(
                generate_property_stream_compare(params, address, research_body=body)
            ),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    task = cast(_CeleryTaskWithDelay, compare_property_task).delay(
        params=params, address=address, research_body=body
    )
    register_task_owner(task.id, str(user.id))

    return jsonify(
        {
            "success": True,
            "task_id": task.id,
            "status": "PENDING",
            "message": "Property comparison task has been queued",
        }
    ), 202


@research_bp.route("/task-status/<task_id>", methods=["GET"])
@handle_exceptions_with_logging
@require_authenticated_user
def get_task_status(user, task_id: str):
    """
    Get the status of a research task (property or compare).

    Returns:
    {
        "success": true,
        "task_id": "task-uuid",
        "status": "SUCCESS|PENDING|PROGRESS|FAILURE",
        "result": {...},
        "meta": {...}
    }
    """
    if not verify_task_owner(task_id, str(user.id)):
        current_app.logger.warning(
            "[RESEARCH] Task status denied: user %s task %s",
            user.id,
            task_id,
        )
        return _forbidden_task_access()

    try:
        task_result = celery.AsyncResult(task_id)

        response = {
            "success": True,
            "task_id": task_id,
            "status": task_result.status,
        }

        if task_result.status == "PENDING":
            response["message"] = "Task is waiting to be processed"

        elif task_result.status == "PROGRESS":
            response["meta"] = task_result.info
            response["message"] = (
                task_result.info.get("status", "Task is in progress")
                if isinstance(task_result.info, dict)
                else "Task is in progress"
            )

        elif task_result.status == "SUCCESS":
            task_data = task_result.result
            if isinstance(task_data, dict) and task_data.get("success"):
                response["result"] = task_data.get("response_data", {})
                response["status_code"] = task_data.get("status_code", 200)
                response["elapsed_time"] = task_data.get("elapsed_time")
            else:
                response["result"] = task_data
            response["message"] = "Task completed successfully"

        elif task_result.status == "FAILURE":
            response["error"] = "Task failed"
            response["message"] = "Task failed"
            response["success"] = False

        else:
            response["message"] = f"Task status: {task_result.status}"

        return jsonify(response)

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Error getting task status",
            {"task_id": task_id, "error": str(e), "endpoint": "get_task_status"},
        )
        response, status = SecureErrorHandler.create_secure_response("server_error", 500)
        return response, status
