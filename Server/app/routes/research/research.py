from __future__ import annotations

from typing import Any, Protocol, cast

from flask import Blueprint, Response, jsonify, stream_with_context
from flask import request as req

from app.schemas import PropertyRequest
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.route.http_errors import forbidden, invalid_request, server_error
from app.utils.security.celery_task_ownership import register_task_owner, verify_task_owner
from app.utils.validation import validate_request
from logger import log

from ...celery.celery_worker import celery
from ...celery.tasks import compare_property_task, research_property_task
from ...services.research.property.property_params import build_property_params


class _CeleryTaskWithDelay(Protocol):
    """Protocol for Celery task so Pyright accepts .delay()."""

    def delay(self, **kwargs: Any) -> Any: ...


research_bp = Blueprint("research", __name__, url_prefix="/api/v1/research")


def _forbidden_task_access():
    return forbidden()


@research_bp.route("/property", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(PropertyRequest)
def get_property_via_address(user, data: PropertyRequest):
    """
    Fetch property detail using exactly one of:
    zpid, property_url, or address (address-only is fine).
    Enhanced with commute map visualization data.
    Supports streaming via ?stream=true query parameter.
    Non-streaming requests are processed via Celery tasks.
    """
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
        return invalid_request("Provide one of: zpid, property_url, or address")

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
def compare_property(user, data: PropertyRequest):
    """
    Compare property endpoint - same as /property but skips pros/cons generation.
    Optimized for comparison use cases where pros/cons are not needed.
    Supports streaming via ?stream=true query parameter.
    Non-streaming requests are processed via Celery tasks.
    """
    body = data.model_dump()
    zpid = body.get("zpid")
    property_url = body.get("property_url")
    address = body.get("address")

    log.info(
        "SEARCH",
        "compare_property_request",
        {
            "has_zpid": bool(zpid),
            "has_property_url": bool(property_url),
            "has_address": bool(address),
        },
    )

    stream_mode = (
        req.args.get("stream", "false").lower() == "true"
        or req.headers.get("X-Stream", "").lower() == "true"
    )

    params = build_property_params(zpid=zpid, property_url=property_url, address=address)
    if params is None:
        log.warn("SEARCH", "compare_property_invalid_request", None)
        return invalid_request("Provide one of: zpid, property_url, or address")

    if stream_mode:
        log.info("SEARCH", "compare_property_streaming_enabled", None)
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
        log.warn(
            "AUTH",
            "research_task_status_denied",
            {"user_id": str(user.id), "task_id": task_id},
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
            "ERRORS",
            "Error getting task status",
            {"task_id": task_id, "error": str(e), "endpoint": "get_task_status"},
        )
        response, status = server_error(
            e, context={"endpoint": "get_task_status", "task_id": task_id}
        )
        return response, status
