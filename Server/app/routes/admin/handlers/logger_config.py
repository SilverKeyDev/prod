from flask import jsonify, request

from app.schemas import GetLoggerConfigResponse, UpdateLoggerConfigRequest
from app.services.admin.deployment_logger_config import (
    get_resolved_deployment_logger_config,
    merge_and_persist,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, log


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(GetLoggerConfigResponse)
def get_logger_config(user):
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin logger config read attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response(
            "Admin access required", status_code=403, error_code="admin_forbidden"
        )

    config = get_resolved_deployment_logger_config()
    return standardize_success_response({"config": config})


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateLoggerConfigRequest)
@validate_response(GetLoggerConfigResponse)
def update_logger_config(user, data: UpdateLoggerConfigRequest | None = None):
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin logger config update attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response(
            "Admin access required", status_code=403, error_code="admin_forbidden"
        )

    if data is None:
        request_data = request.get_json(silent=True) or {}
    else:
        request_data = data.model_dump()
    updates = request_data.get("updates") or {}
    if not isinstance(updates, dict):
        return standardize_error_response(
            "Invalid updates payload", status_code=400, error_code="validation_error"
        )

    try:
        resolved = merge_and_persist(getattr(user, "id", None), updates)
        if resolved is None:
            return standardize_error_response(
                "No valid logger fields to update", status_code=400, error_code="validation_error"
            )

        changed_scopes = [
            scope for scope in ("client", "server") if isinstance(updates.get(scope), dict)
        ]
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Admin updated deployment logger config",
            {
                "user_id": getattr(user, "id", None),
                "scopes": changed_scopes,
            },
        )
        return standardize_success_response({"config": resolved})
    except Exception as exc:  # pragma: no cover - defensive
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to update logger config",
            {"error": str(exc)},
        )
        return jsonify(
            {
                "success": False,
                "error": "server_error",
                "message": "Failed to update logger config",
            }
        ), 500
