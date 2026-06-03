"""Admin endpoint to reset scoped dev/test data for a user."""

from app.schemas import DevUserDataResetRequest, DevUserDataResetResponse
from app.services.auth.user.reset_user_dev_data import (
    VALID_SCOPES,
    dev_user_data_reset_enabled,
    reset_user_dev_data,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role, user_has_super_admin_role
from app.utils.validation import validate_request, validate_response
from logger import log

from ._errors import (
    admin_access_denied,
    configuration_unavailable,
    not_found,
    super_admin_access_denied,
    validation,
)


def _scope_to_str(scope: object) -> str:
    value = getattr(scope, "value", scope)
    return str(value).strip()


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(DevUserDataResetRequest)
@validate_response(DevUserDataResetResponse)
def reset_dev_user_data_route(user, data: DevUserDataResetRequest):
    """Reset scoped dev/test data (profile, preferences, DocuSign, checklist, S3, connections)."""
    if not dev_user_data_reset_enabled():
        return configuration_unavailable(
            context={"feature": "dev_user_data_reset"},
        )

    if not user_has_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized admin reset dev user data attempt",
            {"actor_id": getattr(user, "id", None)},
        )
        return admin_access_denied()

    if data.confirm is not True:
        return validation('confirm must be true (JSON boolean). Send {"confirm": true}')
    raw_scopes = data.scopes
    raw_user_id = data.user_id

    if not isinstance(raw_scopes, list) or len(raw_scopes) < 1:
        return validation("scopes must be a non-empty array")

    scope_set = {_scope_to_str(s) for s in raw_scopes if _scope_to_str(s)}
    invalid = scope_set - VALID_SCOPES
    if invalid:
        return validation(
            f"Invalid scopes: {sorted(invalid)}. Allowed: {sorted(VALID_SCOPES)}",
        )
    if not scope_set:
        return validation(
            "scopes must include at least one of profile, preferences, docusign, "
            "transaction_steps, s3, connections",
        )

    actor_id = str(getattr(user, "id", "") or "")

    if raw_user_id is not None and str(raw_user_id).strip():
        if not user_has_super_admin_role(user):
            log.security(
                "SECURITY",
                "Non-superadmin attempted reset for another user",
                {"actor_id": actor_id, "requested_target": str(raw_user_id).strip()},
            )
            return super_admin_access_denied(
                "Super admin access required to reset another user's data",
            )
        target_id = str(raw_user_id).strip()
    else:
        target_id = actor_id

    try:
        cleared = reset_user_dev_data(target_id, scope_set)
    except ValueError as exc:
        return validation(str(exc))

    if cleared is None:
        return not_found("User not found")

    log.security(
        "SECURITY",
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
