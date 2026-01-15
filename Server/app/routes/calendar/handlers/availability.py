"""
Availability query endpoints for Google Calendar
"""

from flask import request, jsonify, make_response

from app.services.calendar.core import (
    google_calendar_service,
    get_authenticated_user_id,
    handle_google_api_error,
)
from app.services.calendar.permissions import (
    check_permission,
    require_permission,
)
from app.services.calendar.permissions.constants import permissions
from app.models import User, AgentConnections
from app.utils.security.app_logging import get_logger
from app.utils.security.security import rate_limit

logger = get_logger()


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
        
        # Check if user has calendar_freebusy or calendar_events_freebusy permission
        has_freebusy = check_permission(user_id, 'calendar_freebusy')
        has_events_freebusy = check_permission(user_id, 'calendar_events_freebusy')
        
        if not has_freebusy and not has_events_freebusy:
            # Return error response
            has_permission, error_response = require_permission(
                user_id,
                'calendar_freebusy',
                context="query availability"
            )
            return jsonify(error_response), 403
        
        freebusy_result = google_calendar_service.query_freebusy(
            user_id, time_min, time_max, calendar_ids
        )
        
        return jsonify({
            "success": True,
            "data": {"calendars": freebusy_result}
        })
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "query freebusy")


@rate_limit(max_requests=100, window_seconds=60)
def query_client_availability(client_id: str):
    """Query availability (free/busy) for a client's calendars
    
    This endpoint allows agents to view client availability without seeing specific event details.
    Only agents can access this endpoint.
    """
    agent_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        # Verify requesting user is an agent
        agent_user = User.query.filter_by(id=agent_id).first()
        if not agent_user or not agent_user.is_agent:
            return jsonify({
                "success": False,
                "error": "unauthorized",
                "message": "Only agents can access client availability"
            }), 403
        
        # Verify client exists and is connected to this agent
        client_user = User.query.filter_by(id=client_id).first()
        if not client_user:
            return jsonify({
                "success": False,
                "error": "client_not_found",
                "message": "Client not found"
            }), 404
        
        # Check if agent has connection with client
        connection = AgentConnections.query.filter_by(
            agent_id=agent_id,
            client_id=client_id
        ).first()
        
        if not connection:
            return jsonify({
                "success": False,
                "error": "unauthorized",
                "message": "You do not have access to this client's calendar"
            }), 403
        
        # Get request data
        data = request.get_json()
        if not data:
            return make_response(("Request body is required", 400))
        
        time_min = data.get("timeMin")
        time_max = data.get("timeMax")
        calendar_ids = data.get("calendarIds", ["primary"])
        
        if not time_min or not time_max:
            return make_response(("timeMin and timeMax are required", 400))
        
        # Check if client has calendar_freebusy permission
        has_permission = check_permission(client_id, 'calendar_freebusy')
        
        if not has_permission:
            # Build custom error message for agents viewing client availability
            # The client needs to connect/reconnect their Google Calendar with proper permissions
            perm_data = permissions.get('calendar_freebusy', {})
            description = perm_data.get('description', 'View availability in calendars')
            
            # Check if client has any Google Calendar connection at all
            from app.services.auth.tokens import tokens_get
            client_token_data = tokens_get(client_id)
            client_has_connection = client_token_data is not None
            
            if client_has_connection:
                # Client has connected but doesn't have the right permissions
                error_message = (
                    f"This client has connected their Google Calendar, but hasn't granted "
                    f"the necessary permission ({description}). "
                    f"The client needs to reconnect their Google Calendar account and grant "
                    f"all requested permissions to enable availability queries."
                )
            else:
                # Client hasn't connected their Google Calendar at all
                error_message = (
                    f"This client hasn't connected their Google Calendar account yet. "
                    f"Please ask them to connect their Google Calendar and grant the "
                    f"necessary permissions ({description}) to enable availability queries."
                )
            
            return jsonify({
                "success": False,
                "error": "client_permission_required",
                "message": error_message,
                "required_permission": "calendar_freebusy",
                "client_id": client_id,
                "client_has_connection": client_has_connection
            }), 403
        
        # Query freebusy for client's calendars (using client's user_id, not agent's)
        # This will use the client's credentials and resolve their calendar IDs
        freebusy_result = google_calendar_service.query_freebusy(
            client_id, time_min, time_max, calendar_ids, resolve_calendar_id=True
        )
        
        return jsonify({
            "success": True,
            "data": {"calendars": freebusy_result}
        })
        
    except Exception as e:
        return handle_google_api_error(e, agent_id, "query client availability")
