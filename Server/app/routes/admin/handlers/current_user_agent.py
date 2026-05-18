"""Admin-only endpoint to set the current user's is_agent flag (for testing/development)."""

from flask import request

from app.dtos.user import UserDTO
from app.schemas import UpdateAgentStatusRequest, UpdateAgentStatusResponse
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
@validate_request(UpdateAgentStatusRequest)
@validate_response(UpdateAgentStatusResponse)
def set_current_user_agent_status(user, data: UpdateAgentStatusRequest | None = None):
    """Set the signed-in user's is_agent flag. Admin only."""
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin set-current-user-agent attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response("Admin access required", status_code=403)

    if data is None:
        request_data = request.get_json(silent=True) or {}
        is_agent = request_data.get("is_agent")
    else:
        is_agent = data.is_agent

    if not isinstance(is_agent, bool):
        return standardize_error_response(
            "is_agent must be a boolean",
            status_code=400,
        )

    user.is_agent = is_agent
    from app import db

    db.session.commit()

    log.info(
        LOG_CATEGORIES["AUTH"],
        "Admin set current user is_agent",
        {"user_id": getattr(user, "id", None), "is_agent": is_agent},
    )

    return standardize_success_response({"user": UserDTO.to_response(user)})
