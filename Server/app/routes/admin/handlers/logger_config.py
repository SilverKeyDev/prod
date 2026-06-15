from app.schemas import GetLoggerConfigResponse, UpdateLoggerConfigRequest
from app.services.admin.deployment_logger_config import (
    get_resolved_deployment_logger_config,
    merge_and_persist,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_request, validate_response
from logger import log

from ._errors import admin_access_denied, server_error, validation


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(GetLoggerConfigResponse)
def get_logger_config(user):
    if not user_has_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized admin logger config read attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return admin_access_denied()

    config = get_resolved_deployment_logger_config()
    return standardize_success_response({"config": config})


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateLoggerConfigRequest)
@validate_response(GetLoggerConfigResponse)
def update_logger_config(user, data: UpdateLoggerConfigRequest):
    if not user_has_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized admin logger config update attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return admin_access_denied()

    request_data = data.model_dump(exclude_unset=True)
    updates = request_data.get("updates") or {}
    if not isinstance(updates, dict):
        return validation("Invalid updates payload")

    try:
        resolved = merge_and_persist(getattr(user, "id", None), updates)
        if resolved is None:
            return validation("No valid logger fields to update")

        changed_scopes = [
            scope for scope in ("client", "server") if isinstance(updates.get(scope), dict)
        ]
        log.security(
            "SECURITY",
            "Admin updated deployment logger config",
            {
                "user_id": getattr(user, "id", None),
                "scopes": changed_scopes,
            },
        )
        return standardize_success_response({"config": resolved})
    except Exception as exc:
        return server_error(
            exc,
            context={
                "handler": "update_logger_config",
                "user_id": getattr(user, "id", None),
            },
        )
