"""
Health and status endpoints for Google Calendar
"""

from datetime import datetime, timezone

from flask import jsonify, make_response

from app.schemas import ConnectionStatusResponse
from app.services.auth.tokens import tokens_get
from app.services.calendar.core import get_authenticated_user_id, google_calendar_service
from app.utils.route import http_errors
from app.utils.security import rate_limit
from app.utils.validation import validate_response
from logger import log


def health_check():
    """Health check endpoint for Google Calendar service"""
    try:
        is_healthy = google_calendar_service.is_healthy()
        status_code = 200 if is_healthy else 503

        return jsonify(
            {
                "status": "healthy" if is_healthy else "unhealthy",
                "service": "google_calendar",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ), status_code
    except Exception as e:
        log.error("CALENDAR", "health_check_error", e)
        return http_errors.external_unavailable(
            e, api_name="Google Calendar", context={"operation": "health_check"}
        )


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(ConnectionStatusResponse)
def connection_status():
    """Check if Google Calendar is connected for the current user"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        token_data = tokens_get(user_id)
        is_connected = token_data is not None

        return jsonify({"success": True, "connected": is_connected})
    except Exception as e:
        log.error("CALENDAR", "connection_status_error", e)
        return http_errors.server_error(
            e, context={"operation": "connection_status", "user_id": user_id}
        )
