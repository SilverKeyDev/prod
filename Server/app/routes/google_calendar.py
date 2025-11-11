"""
Google Calendar OAuth Routes
Handles OAuth flow and Calendar API operations
"""

import os
from datetime import datetime, timezone
from flask import Blueprint, request, redirect, session, jsonify, make_response
from googleapiclient.errors import HttpError

from ..services.google_calendar_service import google_calendar_service
from ..services.security import (
    redact_sensitive_data, 
    validate_oauth_state, 
    sanitize_error_message, 
    log_oauth_event,
    validate_event_data
)
from ..utils.app_logging import get_logger
from ..utils.security import security_error_response, SecurityError, rate_limit
from ..utils.secure_errors import SecureErrorHandler

logger = get_logger()

# Create blueprint
google_calendar_bp = Blueprint("google_calendar", __name__, url_prefix="/api/v1/google")

# Import configuration
from app.config import Config


@google_calendar_bp.route("/health", methods=["GET"])
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


@google_calendar_bp.route("/oauth/start", methods=["GET"])
@rate_limit(max_requests=10, window_seconds=60)
def oauth_start():
    """Start Google OAuth flow with incremental authorization
    
    Query params:
        full_scope: If 'true', request full calendar scope (for agent sharing).
                   Default is False (requests only calendar.events scope).
    """
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        log_oauth_event("start_failed", None, reason="auth_error", error=str(e))
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    # Check if full scope is requested (for agent sharing)
    request_full_scope = request.args.get("full_scope", "false").lower() == "true"
    
    # Generate auth URL and state
    auth_url, state = google_calendar_service.build_auth_url(str(user_id), request_full_scope=request_full_scope)
    session["google_oauth_state"] = state
    
    return redirect(auth_url)


@google_calendar_bp.route("/oauth/callback", methods=["GET"])
@rate_limit(max_requests=20, window_seconds=60)
def oauth_callback():
    """Handle Google OAuth callback"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        log_oauth_event("callback_failed", None, reason="auth_error", error=str(e))
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    state = request.args.get("state")
    code = request.args.get("code")
    error = request.args.get("error")
    
    # Handle OAuth errors
    if error:
        return make_response((f"OAuth error: {error}", 400))
    
    # Validate state
    if not google_calendar_service.validate_state(state, session.get("google_oauth_state")):
        log_oauth_event("callback_failed", user_id, reason="invalid_state")
        return make_response(("Invalid state", 400))
    
    # Exchange code for tokens using service
    try:
        tokens = google_calendar_service.exchange_code_for_tokens(code, user_id)
        
        # Log successful OAuth completion
        log_oauth_event("callback_success", user_id)
        
        # Redirect back to SPA with success indicator
        resp = redirect(f"{Config.FRONTEND_URL}/calendar?google=connected")
        resp.set_cookie(
            "google_calendar_connected", 
            "true", 
            max_age=86400*7, 
            secure=True, 
            httponly=False, 
            samesite="Lax"
        )
        return resp
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("callback_failed", user_id, reason="exception", error=error_msg)
        logger.error(f"OAuth callback error: {error_msg}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "OAuth callback failed")


@google_calendar_bp.route("/me/calendars", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def list_calendars():
    """List user's Google calendars"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error in list_calendars: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        calendars = google_calendar_service.list_calendars(user_id)
        return jsonify({"items": calendars})
    except RuntimeError as e:
        return make_response((str(e), 401))
    except HttpError as e:
        logger.error(f"Google API error in list_calendars: {str(e)}")
        return SecureErrorHandler.handle_error(e, "Failed to list calendars")
    except Exception as e:
        logger.error(f"Error listing calendars: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to list calendars")


@google_calendar_bp.route("/me/events", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def list_events():
    """List events from user's Google calendar"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        calendar_id = request.args.get("calendarId", "primary")
        time_min = request.args.get("timeMin")
        time_max = request.args.get("timeMax")
        max_results = int(request.args.get("maxResults", 100))
        
        events = google_calendar_service.list_events(
            user_id, calendar_id, time_min, time_max, max_results
        )
        return jsonify({"items": events})
        
    except RuntimeError as e:
        return make_response((str(e), 401))
    except HttpError as e:
        logger.error(f"Google API error in list_events: {str(e)}")
        return SecureErrorHandler.handle_error(e, "Failed to list events")
    except Exception as e:
        logger.error(f"Error listing events: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to list events")


@google_calendar_bp.route("/me/events", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
def create_event():
    """Create a new event in user's Google calendar"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        # Validate event data
        event_data = request.get_json()
        if not validate_event_data(event_data):
            return make_response(("Invalid event data", 400))
        
        calendar_id = event_data.pop("calendarId", "primary")
        event = google_calendar_service.create_event(user_id, event_data, calendar_id)
        return jsonify(event), 201
        
    except RuntimeError as e:
        return make_response((str(e), 401))
    except HttpError as e:
        logger.error(f"Google API error in create_event: {str(e)}")
        return SecureErrorHandler.handle_error(e, "Failed to create event")
    except Exception as e:
        logger.error(f"Error creating event: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to create event")


@google_calendar_bp.route("/me/events/<event_id>", methods=["PATCH"])
@rate_limit(max_requests=50, window_seconds=60)
def update_event(event_id):
    """Update an existing event in user's Google calendar"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        # Validate event data
        event_data = request.get_json()
        if not validate_event_data(event_data):
            return make_response(("Invalid event data", 400))
        
        calendar_id = event_data.pop("calendarId", "primary")
        event = google_calendar_service.update_event(user_id, event_id, event_data, calendar_id)
        return jsonify(event), 200
        
    except RuntimeError as e:
        return make_response((str(e), 401))
    except HttpError as e:
        logger.error(f"Google API error in update_event: {str(e)}")
        return SecureErrorHandler.handle_error(e, "Failed to update event")
    except Exception as e:
        logger.error(f"Error updating event: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to update event")


@google_calendar_bp.route("/me/events/<event_id>", methods=["DELETE"])
@rate_limit(max_requests=50, window_seconds=60)
def delete_event(event_id):
    """Delete an event from user's Google calendar"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        calendar_id = request.args.get("calendarId", "primary")
        success = google_calendar_service.delete_event(user_id, event_id, calendar_id)
        return jsonify({"ok": success}), 200
        
    except RuntimeError as e:
        return make_response((str(e), 401))
    except HttpError as e:
        logger.error(f"Google API error in delete_event: {str(e)}")
        return SecureErrorHandler.handle_error(e, "Failed to delete event")
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to delete event")


@google_calendar_bp.route("/oauth/revoke", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def revoke():
    """Revoke Google OAuth access"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        success = google_calendar_service.revoke_access(user_id)
        return jsonify({"ok": success})
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("revoke_failed", user_id, reason="exception", error=error_msg)
        logger.error(f"Error revoking access: {error_msg}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to revoke access")


@google_calendar_bp.route("/calendars", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def create_calendar():
    """Create a secondary calendar (requires full calendar scope)"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        data = request.get_json()
        calendar_name = data.get("name")
        if not calendar_name:
            return make_response(("Calendar name is required", 400))
        
        calendar = google_calendar_service.create_calendar(user_id, calendar_name)
        return jsonify(calendar), 201
        
    except RuntimeError as e:
        return make_response((str(e), 401))
    except HttpError as e:
        logger.error(f"Google API error in create_calendar: {str(e)}")
        return SecureErrorHandler.handle_error(e, "Failed to create calendar")
    except Exception as e:
        logger.error(f"Error creating calendar: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to create calendar")


@google_calendar_bp.route("/calendars/<calendar_id>/acl", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def add_calendar_acl(calendar_id):
    """Add an ACL rule to a calendar (grant agent access)"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        data = request.get_json()
        agent_email = data.get("agent_email")
        role = data.get("role", "writer")
        
        if not agent_email:
            return make_response(("Agent email is required", 400))
        
        acl_rule = google_calendar_service.add_calendar_acl(user_id, calendar_id, agent_email, role)
        return jsonify(acl_rule), 201
        
    except RuntimeError as e:
        return make_response((str(e), 401))
    except HttpError as e:
        logger.error(f"Google API error in add_calendar_acl: {str(e)}")
        return SecureErrorHandler.handle_error(e, "Failed to add calendar ACL")
    except Exception as e:
        logger.error(f"Error adding calendar ACL: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to add calendar ACL")


@google_calendar_bp.route("/calendar/webhook", methods=["POST"])
def calendar_webhook():
    """Handle Google Calendar webhook notifications"""
    # Validate headers
    resource_state = request.headers.get("X-Goog-Resource-State")
    resource_id = request.headers.get("X-Goog-Resource-Id")
    
    if not resource_state or not resource_id:
        return make_response(("Missing webhook headers", 400))
    
    # Log webhook event
    log_oauth_event("webhook_received", None, 
                   resource_state=resource_state, 
                   resource_id=resource_id)
    
    # TODO: Implement webhook processing logic
    # This could include:
    # - Updating local cache
    # - Notifying frontend via WebSocket
    # - Triggering other business logic
    
    return jsonify({"ok": True})


