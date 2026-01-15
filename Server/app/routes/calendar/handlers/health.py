"""
Health and status endpoints for Google Calendar
"""

from datetime import datetime, timezone
from flask import jsonify

from app.services.calendar.core import google_calendar_service, get_authenticated_user_id
from app.utils.security.app_logging import get_logger
from app.utils.security.security import rate_limit
from app.services.auth.tokens import tokens_get

logger = get_logger()


def health_check():
    """Health check endpoint for Google Calendar service"""
    try:
        is_healthy = google_calendar_service.is_healthy()
        status_code = 200 if is_healthy else 503
        
        return jsonify({
            "status": "healthy" if is_healthy else "unhealthy",
            "service": "google_calendar",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), status_code
    except Exception as e:
        logger.error(f"Health check error: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "service": "google_calendar",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500


@rate_limit(max_requests=100, window_seconds=60)
def connection_status():
    """Check if Google Calendar is connected for the current user"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        token_data = tokens_get(user_id)
        is_connected = token_data is not None
        
        return jsonify({
            "success": True,
            "data": {
                "isConnected": is_connected
            }
        })
    except Exception as e:
        logger.error(f"Error checking connection status for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Failed to check connection status"
        }), 500
