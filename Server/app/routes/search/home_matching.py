from typing import Any, Protocol, cast

from flask import Blueprint, jsonify, request

from app.schemas import FindMatchesRequest, TaskStatusResponse
from app.services.search.home_matching.preprocessing.home_input_data import (
    format_homes_data_from_api,
)
from app.services.search.home_matching.preprocessing.user_input_data import get_user_data_from_dict
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.celery_task_ownership import register_task_owner, verify_task_owner
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, log

from ...celery.celery_worker import celery
from ...celery.tasks import find_best_matches_task
from ...utils.security.secure_errors import SecureErrorHandler


class _CeleryTaskWithDelay(Protocol):
    """Protocol for Celery task so Pyright accepts .delay()."""

    def delay(self, **kwargs: Any) -> Any:
        ...


home_matching_bp = Blueprint("home_matching", __name__, url_prefix="/api/home-matching")


def _forbidden_task_access():
    return jsonify(
        {
            "success": False,
            "error": "FORBIDDEN",
            "message": "Access denied to this task",
        }
    ), 403


@home_matching_bp.route("/find-matches", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(FindMatchesRequest)
@validate_response(TaskStatusResponse)
def find_matches(user, data: FindMatchesRequest | None = None):
    """
    Start a background task to find the best home matches for a user.

    Expected JSON payload:
    {
        "user_data": {...},
        "homes_data": [...],
        "top_k": 10,
        "include_explanations": false,
        "embedding_provider": "sentence_transformer"
    }

    Returns:
    {
        "success": true,
        "task_id": "task-uuid",
        "status": "Task started",
        "message": "Home matching task has been queued"
    }
    """
    try:
        if data is None:
            payload = request.get_json()
            if not payload:
                return jsonify({"success": False, "error": "No JSON data provided"}), 400
            if "user_data" not in payload:
                return jsonify({"success": False, "error": "user_data is required"}), 400
            if "homes_data" not in payload:
                return jsonify({"success": False, "error": "homes_data is required"}), 400
            homes_data_raw = payload["homes_data"]
            if not isinstance(homes_data_raw, list):
                return jsonify({"success": False, "error": "homes_data must be a list"}), 400
            if len(homes_data_raw) == 0:
                return jsonify({"success": False, "error": "homes_data cannot be empty"}), 400
            user_data = payload["user_data"]
            homes_data = homes_data_raw
            top_k = payload.get("top_k", 10)
            include_explanations = payload.get("include_explanations", False)
            embedding_provider = payload.get("embedding_provider", "sentence_transformer")
        else:
            dumped = data.model_dump()
            user_data = dumped["user_data"]
            homes_data = dumped["homes_data"]
            top_k = dumped.get("top_k") if dumped.get("top_k") is not None else 10
            include_explanations = (
                dumped["include_explanations"]
                if dumped.get("include_explanations") is not None
                else False
            )
            embedding_provider = (
                dumped["embedding_provider"]
                if dumped.get("embedding_provider") is not None
                else "sentence_transformer"
            )
            if len(homes_data) == 0:
                return jsonify({"success": False, "error": "homes_data cannot be empty"}), 400

        if not isinstance(user_data, dict):
            user_data = {}
        user_data["user_id"] = str(user.id)

        user_data = get_user_data_from_dict(user_data)
        homes_data = format_homes_data_from_api(homes_data)

        task = cast(_CeleryTaskWithDelay, find_best_matches_task).delay(
            user_data=user_data,
            homes_data=homes_data,
            top_k=top_k,
            include_explanations=include_explanations,
            embedding_provider=embedding_provider,
        )
        register_task_owner(task.id, str(user.id))

        return jsonify(
            {
                "success": True,
                "task_id": task.id,
                "status": "PENDING",
                "message": "Home matching task has been queued",
                "user_id": user_data.get("user_id"),
                "homes_count": len(homes_data),
                "top_k": top_k,
                "include_explanations": include_explanations,
            }
        ), 202

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Error starting home matching task",
            {"error": str(e), "endpoint": "find_matches"},
        )
        response, status = SecureErrorHandler.create_secure_response("server_error", 500)
        return response, status


@home_matching_bp.route("/task-status/<task_id>", methods=["GET"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(TaskStatusResponse)
def get_task_status(user, task_id: str):
    """
    Get the status of a home matching task.

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
            response["result"] = task_result.result
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


@home_matching_bp.errorhandler(400)
def bad_request(error):
    return jsonify(
        {"success": False, "error": "Bad request", "message": "Invalid request data"}
    ), 400


@home_matching_bp.errorhandler(401)
def unauthorized(error):
    return jsonify(
        {"success": False, "error": "Unauthorized", "message": "Authentication required"}
    ), 401


@home_matching_bp.errorhandler(500)
def internal_error(error):
    return jsonify(
        {
            "success": False,
            "error": "Internal server error",
            "message": "An unexpected error occurred",
        }
    ), 500
