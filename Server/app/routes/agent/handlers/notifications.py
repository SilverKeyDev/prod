"""Agent notification counter endpoint."""

import logging

from flask import jsonify

from app.services.agent import get_notification_counter
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.security import rate_limit

logger = logging.getLogger(__name__)


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_notification_counter_endpoint(user):
    """Get total notification count (unread messages + pending requests)"""
    if not user.id:
        logger.error("User ID is None in get_notification_counter")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    total_count = get_notification_counter(str(user.id), bool(user.is_agent))
    return jsonify({"success": True, "total_count": total_count})
