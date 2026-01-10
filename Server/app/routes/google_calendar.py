"""
Google Calendar OAuth Routes
Handles OAuth flow and Calendar API operations
"""

from datetime import datetime, timezone
import json
from flask import Blueprint, request, redirect, session, jsonify, make_response

from ..services.calendar.google_calendar_service import google_calendar_service
from ..services.calendar.auth_helpers import get_authenticated_user_id
from ..services.calendar.error_handlers import handle_google_api_error
from ..services.calendar.event_helpers import (
    extract_event_datetimes,
    validate_max_results,
    extract_calendar_id_from_request
)
from ..utils.security.app_logging import get_logger
from ..utils.security.security import (
    security_error_response,
    SecurityError,
    rate_limit,
    sanitize_error_message,
    log_oauth_event,
    validate_event_data
)
from ..utils.security.secure_errors import SecureErrorHandler
from ..config import Config

logger = get_logger()

# Create blueprint
google_calendar_bp = Blueprint("google_calendar", __name__, url_prefix="/api/v1/google")


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


@google_calendar_bp.route("/connection-status", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def connection_status():
    """Check if Google Calendar is connected for the current user"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        from ..services.auth.tokens import tokens_get
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


@google_calendar_bp.route("/oauth/start", methods=["GET"])
@rate_limit(max_requests=10, window_seconds=60)
def oauth_start():
    """Start Google OAuth flow with incremental authorization
    
    Query params:
        full_scope: If 'true', request calendar.app.created scope for creating/updating events.
                   Non-sensitive, no OAuth verification required. Default is False.
        scheduling: If 'true', request calendar.app.created and calendar.freebusy scopes.
                   Note: calendar.freebusy requires OAuth verification.
                   Default uses only calendar.app.created (non-sensitive, no verification required).
    """
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        log_oauth_event("start_failed", None, reason="auth_error", error="authentication_failed")
        return error_response
    
    # Check if full scope is requested (for agent sharing)
    request_full_scope = request.args.get("full_scope", "false").lower() == "true"
    # Check if scheduling scopes are requested (for scheduling MVP)
    use_scheduling_scopes = request.args.get("scheduling", "false").lower() == "true"
    
    # Generate auth URL and state
    auth_url, state = google_calendar_service.build_auth_url(
        user_id, 
        request_full_scope=request_full_scope,
        use_scheduling_scopes=use_scheduling_scopes
    )
    # Use separate session key for calendar flow to avoid conflicts with auth OAuth
    session["google_calendar_oauth_state"] = state
    
    return redirect(auth_url)


@google_calendar_bp.route("/oauth/callback", methods=["GET"])
@rate_limit(max_requests=20, window_seconds=60)
def oauth_callback():
    """Handle Google OAuth callback"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        log_oauth_event("callback_failed", None, reason="auth_error", error="authentication_failed")
        return error_response
    
    state = request.args.get("state")
    code = request.args.get("code")
    error = request.args.get("error")
    
    # Handle OAuth errors
    if error:
        return make_response((f"OAuth error: {error}", 400))
    
    # Validate state - use separate session key for calendar flow
    if not google_calendar_service.validate_state(state, session.get("google_calendar_oauth_state")):
        log_oauth_event("callback_failed", user_id, reason="invalid_state")
        return make_response(("Invalid state", 400))
    
    # Exchange code for tokens using service
    try:
        tokens = google_calendar_service.exchange_code_for_tokens(code, user_id)
        
        # Check if scheduling scopes were granted and create SilverKey calendar if needed
        granted_scopes = tokens.get("scope", "").split() if tokens.get("scope") else []
        has_scheduling_scopes = (
            "https://www.googleapis.com/auth/calendar.app.created" in granted_scopes or
            "calendar.app.created" in " ".join(granted_scopes)
        )
        
        if has_scheduling_scopes:
            try:
                # Create SilverKey calendar if it doesn't exist (buyer_name is ignored, always creates "SilverKey")
                google_calendar_service.get_or_create_silverkey_calendar(user_id, None)
            except Exception as e:
                # Log but don't fail OAuth if calendar creation fails
                logger.warning(f"Failed to create SilverKey calendar during OAuth: {str(e)}")
        
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
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        calendars = google_calendar_service.list_calendars(user_id)
        return jsonify({
            "success": True,
            "data": {"items": calendars}
        })
    except Exception as e:
        return handle_google_api_error(e, user_id, "list calendars")


@google_calendar_bp.route("/me/events", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def list_events():
    """List events from user's Google calendar"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        calendar_id = request.args.get("calendarId", "primary")
        time_min = request.args.get("timeMin")
        time_max = request.args.get("timeMax")
        max_results = validate_max_results(request.args.get("maxResults", "100"))
        
        events = google_calendar_service.list_events(
            user_id, calendar_id, time_min, time_max, max_results
        )
        
        # Ensure events is a list (handle None or unexpected response format)
        if events is None:
            events = []
        elif not isinstance(events, list):
            logger.warning(f"Unexpected events format for user {user_id}: {type(events)}")
            events = []
        
        return jsonify({
            "success": True,
            "data": {"items": events}
        })
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "list events")


@google_calendar_bp.route("/me/events/today", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def list_today_events():
    """List events from user's Google calendar for today only"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        from datetime import datetime, timezone, timedelta
        
        calendar_id = request.args.get("calendarId", "primary")
        max_results = validate_max_results(request.args.get("maxResults", "100"))
        
        # Calculate today's start and end times in UTC
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        time_min = today_start.isoformat()
        time_max = today_end.isoformat()
        
        events = google_calendar_service.list_events(
            user_id, calendar_id, time_min, time_max, max_results
        )
        
        # Ensure events is a list (handle None or unexpected response format)
        if events is None:
            events = []
        elif not isinstance(events, list):
            logger.warning(f"Unexpected events format for user {user_id}: {type(events)}")
            events = []
        
        return jsonify({
            "success": True,
            "data": {"items": events}
        })
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "list today events")


@google_calendar_bp.route("/me/events", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
def create_event():
    """Create a new event in user's Google calendar and save to database
    
    Supports cross-calendar event creation for agent-client relationships:
    - If target_user_id is specified, validates relationship and creates event in target's calendar
    - If user is agent and no target_user_id, can infer from context
    - If user is client, automatically creates in agent's calendar as well (if agent has calendar)
    """
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        from ..models import CalendarEvent, User
        from .. import db
        from ..services.agent.client_service import (
            validate_agent_client_relationship,
            get_user_agent_id,
            get_agent_client_ids
        )
        
        # Validate event data
        event_data = request.get_json()
        if not validate_event_data(event_data):
            return make_response(("Invalid event data", 400))
        
        # Extract parameters
        calendar_id = extract_calendar_id_from_request(event_data)
        event_type = event_data.pop("eventType", None)  # Optional event type from frontend
        target_user_id = event_data.pop("target_user_id", None)  # Optional target user ID
        create_in_agent_calendar = event_data.pop("create_in_agent_calendar", True)  # Default true for clients
        
        # Get current user to determine role
        current_user = User.query.filter_by(id=user_id).first()
        if not current_user:
            return make_response(("User not found", 404))
        
        is_agent = current_user.is_agent
        target_user_id_final = None
        should_create_in_agent_calendar = False
        
        # Determine target calendar based on relationships
        if target_user_id:
            # Validate relationship exists
            if is_agent:
                # Agent creating event for client
                if not validate_agent_client_relationship(user_id, target_user_id):
                    return make_response(("Client is not assigned to this agent", 403))
                target_user_id_final = target_user_id
            else:
                # Client creating event - target_user_id should be their agent
                agent_id = get_user_agent_id(user_id)
                if not agent_id or agent_id != target_user_id:
                    return make_response(("Target user is not your agent", 403))
                target_user_id_final = target_user_id
        else:
            # Infer from context
            if is_agent:
                # Agent creating event - if they have clients, create in agent's own calendar
                # (Agent can specify target_user_id if they want to create in specific client's calendar)
                client_ids = get_agent_client_ids(user_id)
                if client_ids and len(client_ids) == 1:
                    # If agent has exactly one client, could default to that client
                    # But for now, create in agent's calendar unless target_user_id is specified
                    target_user_id_final = None  # Create in agent's calendar
                else:
                    target_user_id_final = None  # Create in agent's calendar
            else:
                # Client creating event - should also create in agent's calendar
                agent_id = get_user_agent_id(user_id)
                if agent_id:
                    target_user_id_final = None  # Create in client's calendar
                    should_create_in_agent_calendar = create_in_agent_calendar
                else:
                    target_user_id_final = None  # Create in client's calendar (no agent)
        
        # Create event in primary calendar (target or creator's)
        primary_target = target_user_id_final if target_user_id_final else user_id
        google_event = None
        calendar_event = None
        
        try:
            # Create event in primary calendar
            google_event = google_calendar_service.create_event(
                user_id, 
                event_data.copy(), 
                calendar_id, 
                target_user_id=primary_target if primary_target != user_id else None
            )
            
            # Parse start and end datetime from Google event response
            start_datetime, end_datetime, timezone_str = extract_event_datetimes(google_event)
            
            # Determine actual calendar ID used (may be resolved to SilverKey)
            actual_calendar_id = google_event.get("organizer", {}).get("email")
            # Get the calendar ID from the event - we'll use the resolved calendar_id
            # For SilverKey calendar, we need to get it from the service
            if primary_target != user_id:
                try:
                    target_calendar = google_calendar_service.get_or_create_silverkey_calendar(primary_target)
                    actual_calendar_id = target_calendar.get("id")
                except:
                    actual_calendar_id = calendar_id
            else:
                try:
                    user_calendar = google_calendar_service.get_or_create_silverkey_calendar(user_id)
                    actual_calendar_id = user_calendar.get("id")
                except:
                    actual_calendar_id = calendar_id
            
            # Create CalendarEvent record in database
            calendar_event = CalendarEvent(
                user_id=primary_target,
                calendar_id=actual_calendar_id,
                google_event_id=google_event.get("id"),
                summary=google_event.get("summary", event_data.get("summary", "")),
                description=google_event.get("description") or event_data.get("description"),
                location=google_event.get("location") or event_data.get("location"),
                event_type=event_type,
                creator_id=user_id,
                target_user_id=primary_target if primary_target != user_id else None,
                start_datetime=start_datetime,
                end_datetime=end_datetime,
                timezone=timezone_str,
                attendees=google_event.get("attendees"),
                reminders=google_event.get("reminders"),
                status=google_event.get("status", "confirmed"),
                is_synced=True,
                last_synced_at=datetime.now(timezone.utc),
                sync_source="google"
            )
            
            # Calculate duration
            calendar_event.calculate_duration()
            
            # Save to database
            db.session.add(calendar_event)
            
        except Exception as e:
            logger.error(f"Error creating primary event: {e}", exc_info=True)
            raise
        
        # If client creating event and should_create_in_agent_calendar, also create in agent's calendar
        # Handle multiple agents: create in all agents' calendars
        if should_create_in_agent_calendar and not is_agent:
            from ..services.auth.tokens import tokens_get
            from ..models import User
            
            # Get all agents for this client
            client_user = User.query.filter_by(id=user_id).first()
            agent_ids = []
            
            if client_user and client_user.agent_id:
                try:
                    if isinstance(client_user.agent_id, str):
                        try:
                            agent_ids = json.loads(client_user.agent_id)
                        except json.JSONDecodeError:
                            agent_ids = [aid.strip() for aid in client_user.agent_id.split(',') if aid.strip()]
                    else:
                        agent_ids = client_user.agent_id if isinstance(client_user.agent_id, list) else []
                except Exception as e:
                    logger.error(f"Error parsing agent_id for client {user_id}: {e}")
                    agent_ids = []
            
            # Create event in each agent's calendar
            for agent_id in agent_ids:
                try:
                    # Check if agent has calendar connected
                    agent_tokens = tokens_get(agent_id)
                    
                    if agent_tokens:
                        # Create event in agent's calendar
                        agent_event_data = event_data.copy()
                        agent_google_event = google_calendar_service.create_event(
                            user_id,
                            agent_event_data,
                            calendar_id,
                            target_user_id=agent_id
                        )
                        
                        # Parse datetime
                        agent_start_datetime, agent_end_datetime, agent_timezone_str = extract_event_datetimes(agent_google_event)
                        
                        # Get agent's calendar ID
                        try:
                            agent_calendar = google_calendar_service.get_or_create_silverkey_calendar(agent_id)
                            agent_calendar_id = agent_calendar.get("id")
                        except:
                            agent_calendar_id = calendar_id
                        
                        # Create CalendarEvent record for agent's calendar
                        agent_calendar_event = CalendarEvent(
                            user_id=agent_id,
                            calendar_id=agent_calendar_id,
                            google_event_id=agent_google_event.get("id"),
                            summary=agent_google_event.get("summary", event_data.get("summary", "")),
                            description=agent_google_event.get("description") or event_data.get("description"),
                            location=agent_google_event.get("location") or event_data.get("location"),
                            event_type=event_type,
                            creator_id=user_id,
                            target_user_id=agent_id,
                            shared_with_user_ids=[user_id],  # Shared with client
                            start_datetime=agent_start_datetime,
                            end_datetime=agent_end_datetime,
                            timezone=agent_timezone_str,
                            attendees=agent_google_event.get("attendees"),
                            reminders=agent_google_event.get("reminders"),
                            status=agent_google_event.get("status", "confirmed"),
                            is_synced=True,
                            last_synced_at=datetime.now(timezone.utc),
                            sync_source="google"
                        )
                        
                        agent_calendar_event.calculate_duration()
                        db.session.add(agent_calendar_event)
                        
                        # Update primary event to track sharing with multiple users
                        if calendar_event:
                            # Initialize shared_with_user_ids as list if None
                            if calendar_event.shared_with_user_ids is None:
                                calendar_event.shared_with_user_ids = []
                            elif not isinstance(calendar_event.shared_with_user_ids, list):
                                # Convert to list if it's stored as something else
                                calendar_event.shared_with_user_ids = [calendar_event.shared_with_user_ids]
                            
                            # Add agent_id if not already in list
                            if agent_id not in calendar_event.shared_with_user_ids:
                                calendar_event.shared_with_user_ids.append(agent_id)
                        
                        logger.info(f"Event also created in agent {agent_id}'s calendar")
                    else:
                        logger.warning(f"Agent {agent_id} does not have Google Calendar connected, skipping agent calendar creation")
                except Exception as e:
                    # Log but don't fail the primary event creation
                    logger.error(f"Error creating event in agent {agent_id}'s calendar: {e}", exc_info=True)
                    # Continue to next agent if multiple
        
        db.session.commit()
        
        logger.info(f"Event created and saved to database: {calendar_event.id} for user {user_id}, target: {primary_target}")
        
        return jsonify({
            "success": True,
            "data": google_event
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_google_api_error(e, user_id, "create event")


@google_calendar_bp.route("/me/events/<event_id>", methods=["PATCH"])
@rate_limit(max_requests=50, window_seconds=60)
def update_event(event_id):
    """Update an existing event in user's Google calendar"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        # Validate event data
        event_data = request.get_json()
        if not validate_event_data(event_data):
            return make_response(("Invalid event data", 400))
        
        calendar_id = extract_calendar_id_from_request(event_data)
        event = google_calendar_service.update_event(user_id, event_id, event_data, calendar_id)
        return jsonify({
            "success": True,
            "data": event
        }), 200
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "update event")


@google_calendar_bp.route("/me/events/<event_id>", methods=["DELETE"])
@rate_limit(max_requests=50, window_seconds=60)
def delete_event(event_id):
    """Delete an event from user's Google calendar"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        calendar_id = request.args.get("calendarId", "primary")
        success = google_calendar_service.delete_event(user_id, event_id, calendar_id)
        return jsonify({
            "success": True,
            "data": {"ok": success}
        }), 200
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "delete event")


@google_calendar_bp.route("/oauth/revoke", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def revoke():
    """Revoke Google OAuth access"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        success = google_calendar_service.revoke_access(user_id)
        return jsonify({
            "success": True,
            "data": {"ok": success}
        })
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("revoke_failed", user_id, reason="exception", error=error_msg)
        logger.error(f"Error revoking access: {error_msg}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to revoke access")


@google_calendar_bp.route("/calendars", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def create_calendar():
    """Create a secondary calendar (requires full calendar scope)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        data = request.get_json()
        calendar_name = data.get("name")
        if not calendar_name:
            return make_response(("Calendar name is required", 400))
        
        calendar = google_calendar_service.create_calendar(user_id, calendar_name)
        return jsonify({
            "success": True,
            "data": calendar
        }), 201
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "create calendar")


@google_calendar_bp.route("/calendars/<calendar_id>/acl", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60)
def add_calendar_acl(calendar_id):
    """Add an ACL rule to a calendar (grant agent access)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        data = request.get_json()
        agent_email = data.get("agent_email")
        role = data.get("role", "writer")
        
        if not agent_email:
            return make_response(("Agent email is required", 400))
        
        acl_rule = google_calendar_service.add_calendar_acl(user_id, calendar_id, agent_email, role)
        return jsonify({
            "success": True,
            "data": acl_rule
        }), 201
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "add calendar ACL")


@google_calendar_bp.route("/me/freebusy", methods=["POST"])
@rate_limit(max_requests=100, window_seconds=60)
def query_freebusy():
    """Query free/busy information for user's calendars"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        data = request.get_json()
        if not data:
            return make_response(("Request body is required", 400))
        
        time_min = data.get("timeMin")
        time_max = data.get("timeMax")
        calendar_ids = data.get("calendarIds", ["primary"])
        
        if not time_min or not time_max:
            return make_response(("timeMin and timeMax are required", 400))
        
        freebusy_result = google_calendar_service.query_freebusy(
            user_id, time_min, time_max, calendar_ids
        )
        
        return jsonify({
            "success": True,
            "data": {"calendars": freebusy_result}
        })
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "query freebusy")


@google_calendar_bp.route("/me/silverkey-calendar", methods=["GET", "POST"])
@rate_limit(max_requests=20, window_seconds=60)
def get_or_create_silverkey_calendar():
    """Get or create the SilverKey calendar for the user"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        buyer_name = None
        if request.method == "POST":
            data = request.get_json()
            if data:
                buyer_name = data.get("buyerName")
        
        calendar = google_calendar_service.get_or_create_silverkey_calendar(user_id, buyer_name)
        return jsonify({
            "success": True,
            "data": calendar
        })
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "get or create SilverKey calendar")


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


