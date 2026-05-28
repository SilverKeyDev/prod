"""Admin-only endpoint to set exclusive dev workspace persona on the signed-in user."""

from app.dtos.user import UserDTO
from app.schemas import SetCurrentUserDevWorkspaceRequest, SetCurrentUserDevWorkspaceResponse
from app.services.auth.dev_workspace_persona import apply_dev_workspace_persona
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
@validate_request(SetCurrentUserDevWorkspaceRequest)
@validate_response(SetCurrentUserDevWorkspaceResponse)
def set_current_user_dev_workspace(user, data: SetCurrentUserDevWorkspaceRequest | None = None):
    """Set exclusive workspace persona on the signed-in user. Admin only."""
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin set-current-user-dev-workspace attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response("Admin access required", status_code=403)

    if data is None:
        return standardize_error_response("workspace is required", status_code=400)

    updated = apply_dev_workspace_persona(user, data.workspace)

    log.info(
        LOG_CATEGORIES["AUTH"],
        "Admin set current user dev workspace persona",
        {"user_id": getattr(updated, "id", None), "workspace": data.workspace.value},
    )

    return standardize_success_response({"user": UserDTO.to_response(updated, include_roles=True)})
