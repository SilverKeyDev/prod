"""
Event CRUD endpoints for Google Calendar
"""

from flask import jsonify, make_response, request

from app import db
from app.models import AgentConnections, User
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.events import (
    extract_calendar_id_from_request,
    validate_max_results,
)
from app.services.calendar.events.creation import (
    create_in_agent_calendars,
    create_primary_event_and_db,
    get_client_events_permission_error,
    resolve_create_event_target,
)
from app.services.calendar.permissions import require_permission
from app.utils.security.app_logging import get_logger
from app.utils.security.security import (
    rate_limit,
    validate_event_data,
)

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
    if user_id is None:
        return make_response(("Unauthorized", 401))

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

        return jsonify({"success": True, "data": {"items": events}})

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
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        event_data = request.get_json()
        if not validate_event_data(event_data):
            return make_response(("Invalid event data", 400))

        has_permission, error_response = require_permission(
            user_id, "calendar_app_created", context="create events"
        )
        if not has_permission:
            return jsonify(error_response), 403

        calendar_id = extract_calendar_id_from_request(event_data)
        event_type = event_data.pop("eventType", None)

        current_user = User.query.filter_by(id=user_id).first()
        result = resolve_create_event_target(user_id, event_data, current_user)
        event_data.pop("target_user_id", None)
        event_data.pop("create_in_agent_calendar", True)
        if isinstance(result[1], int):
            return make_response((result[0], result[1])), result[1]

        primary_target, should_create_in_agent_calendar = result
        is_agent = current_user.is_agent

        google_event, calendar_event = create_primary_event_and_db(
            user_id, event_data, calendar_id, event_type, primary_target
        )

        create_in_agent_calendars(
            user_id,
            event_data,
            calendar_id,
            event_type,
            calendar_event,
            should_create_in_agent_calendar,
            is_agent,
        )

        db.session.commit()
        logger.info(
            "Event created and saved to database: %s for user %s, target: %s",
            calendar_event.id,
            user_id,
            primary_target,
        )
        return jsonify({"success": True, "data": google_event}), 201

    except Exception as e:
        db.session.rollback()
        return handle_google_api_error(e, user_id, "create event")


@rate_limit(max_requests=50, window_seconds=60)
def update_event(event_id):
    """Update an existing event in user's Google calendar"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        # Check if user has calendar_app_created permission
        has_permission, error_response = require_permission(
            user_id, "calendar_app_created", context="update events"
        )
        if not has_permission:
            return jsonify(error_response), 403

        # Validate event data
        event_data = request.get_json()
        if not validate_event_data(event_data):
            return make_response(("Invalid event data", 400))

        calendar_id = extract_calendar_id_from_request(event_data)
        event = google_calendar_service.update_event(user_id, event_id, event_data, calendar_id)
        return jsonify({"success": True, "data": event}), 200

    except Exception as e:
        return handle_google_api_error(e, user_id, "update event")


@rate_limit(max_requests=50, window_seconds=60)
def delete_event(event_id):
    """Delete an event from user's Google calendar"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        # Check if user has calendar_app_created permission
        has_permission, error_response = require_permission(
            user_id, "calendar_app_created", context="delete events"
        )
        if not has_permission:
            return jsonify(error_response), 403
        calendar_id = request.args.get("calendarId", "primary")
        success = google_calendar_service.delete_event(user_id, event_id, calendar_id)
        return jsonify({"success": True, "data": {"ok": success}}), 200

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
    if agent_id is None:
        return make_response(("Unauthorized", 401))

    try:
        # Verify requesting user is an agent
        agent_user = User.query.filter_by(id=agent_id).first()
        if not agent_user or not agent_user.is_agent:
            return jsonify(
                {
                    "success": False,
                    "error": "unauthorized",
                    "message": "Only agents can access client events",
                }
            ), 403

        # Verify client exists and is connected to this agent
        client_user = User.query.filter_by(id=client_id).first()
        if not client_user:
            return jsonify(
                {"success": False, "error": "client_not_found", "message": "Client not found"}
            ), 404

        # Check if agent has connection with client
        connection = AgentConnections.query.filter_by(
            agent_id=agent_id, client_id=client_id
        ).first()

        if not connection:
            return jsonify(
                {
                    "success": False,
                    "error": "unauthorized",
                    "message": "You do not have access to this client's calendar",
                }
            ), 403

        # Get request parameters
        calendar_id = request.args.get("calendarId", "primary")
        time_min = request.args.get("timeMin")
        time_max = request.args.get("timeMax")
        max_results = validate_max_results(request.args.get("maxResults", "100"))

        if not time_min or not time_max:
            return make_response(("timeMin and timeMax are required", 400))

        perm_error = get_client_events_permission_error(client_id)
        if perm_error:
            return jsonify(perm_error), 403

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

        return jsonify({"success": True, "data": {"items": events}})

    except Exception as e:
        return handle_google_api_error(e, agent_id, "list client events")
