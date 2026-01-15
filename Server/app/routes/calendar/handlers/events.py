"""
Event CRUD endpoints for Google Calendar
"""

import json
from datetime import datetime, timezone, timedelta
from flask import request, jsonify, make_response

from app.services.calendar.core import (
    google_calendar_service,
    get_authenticated_user_id,
    handle_google_api_error,
)
from app.services.calendar.events import (
    validate_max_results,
    extract_calendar_id_from_request,
    extract_event_datetimes,
)
from app.services.calendar.permissions import require_permission
from app.utils.security.app_logging import get_logger
from app.utils.security.security import (
    rate_limit,
    validate_event_data,
)
from app.models import CalendarEvent, User, AgentConnections
from app import db
from app.services.agent.client_service import (
    validate_agent_client_relationship,
    get_user_agent_id,
    get_agent_client_ids,
)
from app.services.auth.tokens import tokens_get

logger = get_logger()


@rate_limit(max_requests=100, window_seconds=60)
def list_events():
    """List events from user's Google calendar
    
    Note: This endpoint only returns events for the authenticated user's own calendar.
    Agents should use /clients/{client_id}/availability to view client availability.
    """
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        calendar_id = request.args.get("calendarId", "primary")
        time_min = request.args.get("timeMin")
        time_max = request.args.get("timeMax")
        max_results = validate_max_results(request.args.get("maxResults", "100"))
        
        # This endpoint only returns events for the authenticated user's own calendar
        # Agents should use the availability endpoint to view client calendars
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
        # Validate event data
        event_data = request.get_json()
        if not validate_event_data(event_data):
            return make_response(("Invalid event data", 400))
        
        # Check if user has calendar_app_created permission
        has_permission, error_response = require_permission(
            user_id,
            'calendar_app_created',
            context="create events"
        )
        if not has_permission:
            return jsonify(error_response), 403
        
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


@rate_limit(max_requests=50, window_seconds=60)
def update_event(event_id):
    """Update an existing event in user's Google calendar"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        # Check if user has calendar_app_created permission
        has_permission, error_response = require_permission(
            user_id,
            'calendar_app_created',
            context="update events"
        )
        if not has_permission:
            return jsonify(error_response), 403
        
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


@rate_limit(max_requests=50, window_seconds=60)
def delete_event(event_id):
    """Delete an event from user's Google calendar"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        # Check if user has calendar_app_created permission
        has_permission, error_response = require_permission(
            user_id,
            'calendar_app_created',
            context="delete events"
        )
        if not has_permission:
            return jsonify(error_response), 403
        calendar_id = request.args.get("calendarId", "primary")
        success = google_calendar_service.delete_event(user_id, event_id, calendar_id)
        return jsonify({
            "success": True,
            "data": {"ok": success}
        }), 200
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "delete event")


@rate_limit(max_requests=100, window_seconds=60)
def list_client_events(client_id: str):
    """List events from a client's Google calendar
    
    This endpoint allows agents to view client events with full details.
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
                "message": "Only agents can access client events"
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
        
        # Get request parameters
        calendar_id = request.args.get("calendarId", "primary")
        time_min = request.args.get("timeMin")
        time_max = request.args.get("timeMax")
        max_results = validate_max_results(request.args.get("maxResults", "100"))
        
        if not time_min or not time_max:
            return make_response(("timeMin and timeMax are required", 400))
        
        # Check if client has calendar_app_created permission (allows reading events)
        from app.services.calendar.permissions import check_permission
        from app.services.calendar.permissions.constants import permissions
        from app.services.auth.tokens import tokens_get
        
        has_permission = check_permission(client_id, 'calendar_app_created')
        
        if not has_permission:
            # Build custom error message for agents viewing client events
            # The client needs to connect/reconnect their Google Calendar with proper permissions
            perm_data = permissions.get('calendar_app_created', {})
            description = perm_data.get('description', 'Access calendar events')
            
            # Check if client has any Google Calendar connection at all
            client_token_data = tokens_get(client_id)
            client_has_connection = client_token_data is not None
            
            if client_has_connection:
                # Client has connected but doesn't have the right permissions
                error_message = (
                    f"This client has connected their Google Calendar, but hasn't granted "
                    f"the necessary permission ({description}). "
                    f"The client needs to reconnect their Google Calendar account and grant "
                    f"all requested permissions to enable event queries."
                )
            else:
                # Client hasn't connected their Google Calendar at all
                error_message = (
                    f"This client hasn't connected their Google Calendar account yet. "
                    f"Please ask them to connect their Google Calendar and grant the "
                    f"necessary permissions ({description}) to enable event queries."
                )
            
            return jsonify({
                "success": False,
                "error": "client_permission_required",
                "message": error_message,
                "required_permission": "calendar_app_created",
                "client_id": client_id,
                "client_has_connection": client_has_connection
            }), 403
        
        # List events for client's calendar (using client's user_id, not agent's)
        # This will use the client's credentials and resolve their calendar IDs
        events = google_calendar_service.list_events(
            client_id, calendar_id, time_min, time_max, max_results
        )
        
        # Ensure events is a list (handle None or unexpected response format)
        if events is None:
            events = []
        elif not isinstance(events, list):
            logger.warning(f"Unexpected events format for client {client_id}: {type(events)}")
            events = []
        
        return jsonify({
            "success": True,
            "data": {"items": events}
        })
        
    except Exception as e:
        return handle_google_api_error(e, agent_id, "list client events")
