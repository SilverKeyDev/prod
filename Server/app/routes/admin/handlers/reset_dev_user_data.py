"""Admin endpoint to reset scoped dev/test data for a user."""

from flask import request

from app.schemas import DevUserDataResetRequest, DevUserDataResetResponse
from app.services.auth.user.reset_user_dev_data import (
    VALID_SCOPES,
    dev_user_data_reset_enabled,
    reset_user_dev_data,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role, user_has_super_admin_role
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, log


def _scope_to_str(scope: object) -> str:
    value = getattr(scope, "value", scope)
    return str(value).strip()


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(DevUserDataResetRequest)
@validate_response(DevUserDataResetResponse)
def reset_dev_user_data_route(user, data: DevUserDataResetRequest | None = None):
    """Reset profile, preferences, and/or DocuSign data for dev/testing."""
    if not dev_user_data_reset_enabled():
        return standardize_error_response(
            "Dev user data reset is disabled in this environment",
            status_code=403,
        )

    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin reset dev user data attempt",
            {"actor_id": getattr(user, "id", None)},
        )
        return standardize_error_response("Admin access required", status_code=403)

    if data is None:
        request_data = request.get_json(silent=True) or {}
        if request_data.get("confirm") is not True:
            return standardize_error_response(
                'confirm must be true (JSON boolean). Send {"confirm": true}',
                status_code=400,
            )
        raw_scopes = request_data.get("scopes")
        raw_user_id = request_data.get("user_id")
    else:
        if data.confirm is not True:
            return standardize_error_response(
                'confirm must be true (JSON boolean). Send {"confirm": true}',
                status_code=400,
            )
        raw_scopes = data.scopes
        raw_user_id = data.user_id

    if not isinstance(raw_scopes, list) or len(raw_scopes) < 1:
        return standardize_error_response(
            "scopes must be a non-empty array",
            status_code=400,
        )

    scope_set = {_scope_to_str(s) for s in raw_scopes if _scope_to_str(s)}
    invalid = scope_set - VALID_SCOPES
    if invalid:
        return standardize_error_response(
            f"Invalid scopes: {sorted(invalid)}. Allowed: {sorted(VALID_SCOPES)}",
            status_code=400,
        )
    if not scope_set:
        return standardize_error_response(
            "scopes must include at least one of profile, preferences, docusign",
            status_code=400,
        )

    actor_id = str(getattr(user, "id", "") or "")

    if raw_user_id is not None and str(raw_user_id).strip():
        if not user_has_super_admin_role(user):
            log.security(
                LOG_CATEGORIES["SECURITY"],
                "Non-superadmin attempted reset for another user",
                {"actor_id": actor_id, "requested_target": str(raw_user_id).strip()},
            )
            return standardize_error_response(
                "Super admin access required to reset another user's data",
                status_code=403,
            )
        target_id = str(raw_user_id).strip()
    else:
        target_id = actor_id

    try:
        cleared = reset_user_dev_data(target_id, scope_set)
    except ValueError as exc:
        return standardize_error_response(str(exc), status_code=400)

    if cleared is None:
        return standardize_error_response("User not found", status_code=404)

    log.security(
        LOG_CATEGORIES["SECURITY"],
        "Admin reset dev user data",
        {
            "actor_id": actor_id,
            "target_user_id": target_id,
            "scopes": sorted(cleared.keys()),
        },
    )

    return standardize_success_response(
        {"target_user_id": target_id, "cleared": cleared},
        message="Dev user data reset completed",
    )
