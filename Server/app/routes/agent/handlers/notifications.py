"""Agent notification counter endpoint."""

from flask import jsonify

from app.schemas.generated import NotificationCounterResponse
from app.services.agent import get_notification_counter
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    unauthorized,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_response
from logger import log


@rate_limit(max_requests=200, window_seconds=60)
@validate_response(NotificationCounterResponse)
@handle_exceptions_with_logging
@require_authenticated_user
def get_notification_counter_endpoint(user):
    """Get total notification count (unread messages + pending requests)"""
    if not user.id:
        log.error("AUTH", "User ID is None in get_notification_counter")
        return unauthorized()
    total_count = get_notification_counter(str(user.id), user_is_agent(user))
    return jsonify({"success": True, "total_count": total_count})
