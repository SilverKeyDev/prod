"""Admin-only endpoint to set the current user's is_agent flag (for testing/development)."""

from app.utils.admin import user_has_admin_role
from app.utils.common_patterns import (
    api_route,
    standardize_error_response,
    standardize_success_response,
)
from logger import LOG_CATEGORIES, log


@api_route(require_auth=True, require_json=True)
def set_current_user_agent_status(data, user):
    """Set the signed-in user's is_agent flag. Admin only."""
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized admin set-current-user-agent attempt",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response("Admin access required", status_code=403)

    if "is_agent" not in data:
        return standardize_error_response("is_agent is required", status_code=400)
    is_agent = data.get("is_agent")
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

    return standardize_success_response({"is_agent": user.is_agent})
