"""Admin-only endpoint to set the current user's agent role (for testing/development)."""

from app.dtos.user import UserDTO
from app.schemas import UpdateAgentStatusRequest, UpdateAgentStatusResponse
from app.services.auth.user_role_helpers import set_user_is_agent
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_request, validate_response
from logger import log

from ._errors import admin_access_denied, validation


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateAgentStatusRequest)
@validate_response(UpdateAgentStatusResponse)
def set_current_user_agent_status(user, data: UpdateAgentStatusRequest):
    """Set the signed-in user's agent role. Admin only."""
    if not user_has_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized admin set-current-user-agent attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return admin_access_denied()

    agent_role_enabled = data.agent_role_enabled

    if not isinstance(agent_role_enabled, bool):
        return validation("agent_role_enabled must be a boolean")

    set_user_is_agent(str(user.id), agent_role_enabled)
    from app import db

    db.session.commit()
    db.session.refresh(user)

    log.info(
        "AUTH",
        "Admin set current user agent role",
        {"user_id": getattr(user, "id", None), "agent_role_enabled": agent_role_enabled},
    )

    return standardize_success_response({"user": UserDTO.to_response(user)})
