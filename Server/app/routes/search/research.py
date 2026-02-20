from __future__ import annotations

import json
import os
from typing import Any, Protocol, cast

from flask import Blueprint, Response, current_app, jsonify, stream_with_context
from flask import request as req

from logger import LOG_CATEGORIES, log

from ...celery.celery_worker import celery
from ...celery.tasks import compare_property_task, research_property_task
from ...services.research.property.property_params import build_property_params
from ...utils.security.secure_errors import SecureErrorHandler


class _CeleryTaskWithDelay(Protocol):
    """Protocol for Celery task so Pyright accepts .delay()."""

    def delay(self, **kwargs: Any) -> Any: ...


RAPI_KEY = os.getenv("RAPIDAPI_KEY")

research_bp = Blueprint("research", __name__, url_prefix="/api/v1/research")


@research_bp.route("/property", methods=["POST"])
def get_property_via_address():
    """
    Call RapidAPI property /property using exactly one of:
    zpid, property_url, or address (address-only is fine).
    Enhanced with commute map visualization data.
    Supports streaming via ?stream=true query parameter.
    Non-streaming requests are processed via Celery tasks.
    """
    body = req.get_json(silent=True) or {}
    zpid = body.get("zpid")
    property_url = body.get("property_url")
    address = body.get("address")

    # Check if streaming is requested
    stream_mode = (
        req.args.get("stream", "false").lower() == "true"
        or req.headers.get("X-Stream", "").lower() == "true"
    )

    # Build API parameters
    params = build_property_params(zpid=zpid, property_url=property_url, address=address)
    if params is None:
        return jsonify(
            {
                "success": False,
                "error": "BAD_REQUEST",
                "message": "Provide one of: zpid, property_url, or address",
            }
        ), 400

    # Streaming mode: yield chunks as they're generated (synchronous)
    if stream_mode:
        from ...services.search.property_stream import generate_property_stream

        return Response(
            stream_with_context(generate_property_stream(params, address)),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    # Non-streaming mode: use Celery task
    task = cast(_CeleryTaskWithDelay, research_property_task).delay(
        params=params, address=address, skip_pros_cons=False
    )

    return jsonify(
        {
            "success": True,
            "task_id": task.id,
            "status": "PENDING",
            "message": "Property research task has been queued",
        }
    ), 202


@research_bp.route("/compare", methods=["POST"])
def compare_property():
    """
    Compare property endpoint - same as /property but skips pros/cons generation.
    Optimized for comparison use cases where pros/cons are not needed.
    Supports streaming via ?stream=true query parameter.
    Non-streaming requests are processed via Celery tasks.
    """
    body = req.get_json(silent=True) or {}
    zpid = body.get("zpid")
    property_url = body.get("property_url")
    address = body.get("address")

    # Log request details
    current_app.logger.info(
        f"[COMPARE] Request received - zpid: {zpid}, property_url: {property_url}, address: {address}"
    )

    # Check if streaming is requested
    stream_mode = (
        req.args.get("stream", "false").lower() == "true"
        or req.headers.get("X-Stream", "").lower() == "true"
    )

    # Build API parameters
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

    # Streaming mode: yield chunks as they're generated (without pros/cons) - synchronous
    if stream_mode:
        current_app.logger.info(
            "[COMPARE] Streaming mode enabled - response will be streamed incrementally"
        )
        from ...services.search.property_stream import generate_property_stream_compare

        return Response(
            stream_with_context(generate_property_stream_compare(params, address)),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    # Non-streaming mode: use Celery task
    task = cast(_CeleryTaskWithDelay, compare_property_task).delay(params=params, address=address)

    return jsonify(
        {
            "success": True,
            "task_id": task.id,
            "status": "PENDING",
            "message": "Property comparison task has been queued",
        }
    ), 202


@research_bp.route("/task-status/<task_id>", methods=["GET"])
def get_task_status(task_id: str):
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
    try:
        # Get task result
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
                # Return the actual response data and status code
                response["result"] = task_data.get("response_data", {})
                response["status_code"] = task_data.get("status_code", 200)
                response["elapsed_time"] = task_data.get("elapsed_time")
            else:
                response["result"] = task_data
            response["message"] = "Task completed successfully"

        elif task_result.status == "FAILURE":
            # Avoid leaking internal exception details; log server-side only if needed
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
