"""
Event CRUD endpoints for Google Calendar
"""

from flask import jsonify, make_response, request
from sqlalchemy import select

from app import db
from app.dtos.calendar_event import CalendarEventDTO
from app.models import AgentConnections, User
from app.models.calendar.calendar_event import CalendarEvent
from app.routes.calendar.handlers.errors import (
    calendar_permission_response,
    itinerary_resolution_error,
)
from app.schemas import (
    DeleteEventResponse,
    GoogleCalendarApiResponse,
    GoogleCalendarEventCreateBody,
)
from app.services.auth.user_role_helpers import user_is_agent
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
from app.services.calendar.events.sync import delete_event_from_db, sync_event_to_db
from app.services.calendar.permissions import require_permission
from app.services.calendar.viewing_itinerary import (
    itinerary_for_db,
    merge_viewing_itinerary_into_event_data,
    resolve_itinerary_with_route,
)
from app.utils.route import http_errors
from app.utils.security.security import (
    rate_limit,
    validate_event_data,
)
from app.utils.validation import validate_request, validate_response
from logger import log


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
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
            log.warn(
                "CALENDAR",
                "events_unexpected_format",
                {"user_id": str(user_id), "events_type": str(type(events))},
            )
            events = []

        events = CalendarEventDTO.enrich_events(user_id, events)

        return jsonify({"success": True, "data": {"items": events}})

    except Exception as e:
        return handle_google_api_error(e, user_id, "list events")


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
def fetch_single_calendar_event(event_id: str):
    """GET a single Google Calendar event by id (e.g. poll for Meet link)."""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        has_permission, perm_err = require_permission(
            user_id, "calendar_app_created", context="get events"
        )
        if not has_permission:
            return calendar_permission_response(perm_err)

        calendar_id = request.args.get("calendarId", "primary")
        row = db.session.scalar(
            select(CalendarEvent).where(CalendarEvent.google_event_id == event_id)
        )
        target_user_id = None
        if row:
            if row.user_id != user_id and row.creator_id != user_id:
                return http_errors.forbidden()
            if row.user_id != user_id:
                target_user_id = row.user_id

        event = google_calendar_service.get_event(
            user_id, event_id, calendar_id, target_user_id=target_user_id
        )
        body = CalendarEventDTO.to_response(
            event if isinstance(event, dict) else dict(event),
            calendar_event_row=row,
        )
        return jsonify({"success": True, "data": body}), 200

    except Exception as e:
        return handle_google_api_error(e, user_id, "get event")


@rate_limit(max_requests=50, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(GoogleCalendarEventCreateBody)
def create_event(data: GoogleCalendarEventCreateBody):
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
        event_data = dict(data.model_dump(mode="json", by_alias=True))
        add_google_meet = bool(event_data.pop("addGoogleMeet", False))
        event_data.pop("conferenceData", None)
        if not validate_event_data(event_data):
            return http_errors.validation("Invalid event data")

        has_permission, error_response = require_permission(
            user_id, "calendar_app_created", context="create events"
        )
        if not has_permission:
            return calendar_permission_response(error_response)

        calendar_id = extract_calendar_id_from_request(event_data)
        event_type = event_data.pop("eventType", None) or event_data.pop("silverKeyEventType", None)

        itinerary_raw = event_data.pop("itinerary", None)
        itinerary_plain = itinerary_for_db(itinerary_raw)
        itinerary_db = None
        if itinerary_plain:
            try:
                itinerary_db = resolve_itinerary_with_route(itinerary_plain)
            except (ValueError, RuntimeError) as e:
                return itinerary_resolution_error(e)
            merge_viewing_itinerary_into_event_data(event_data, itinerary_db)

        current_user = db.session.scalar(select(User).where(User.id == user_id))
        result = resolve_create_event_target(user_id, event_data, current_user)
        event_data.pop("target_user_id", None)
        event_data.pop("create_in_agent_calendar", True)
        # bool subclasses int; exclude bool so (primary_target, True) is not treated as HTTP status.
        if isinstance(result[1], int) and not isinstance(result[1], bool):
            return make_response((result[0], result[1])), result[1]

        primary_target, should_create_in_agent_calendar = result
        is_agent = user_is_agent(current_user)

        google_event, calendar_event = create_primary_event_and_db(
            user_id,
            event_data,
            calendar_id,
            event_type,
            primary_target,
            itinerary=itinerary_db,
            add_google_meet=add_google_meet,
        )

        create_in_agent_calendars(
            user_id,
            event_data,
            calendar_id,
            event_type,
            calendar_event,
            should_create_in_agent_calendar,
            is_agent,
            itinerary=itinerary_db,
        )

        db.session.commit()
        log.info(
            "CALENDAR",
            "event_created",
            {
                "event_id": str(calendar_event.id),
                "user_id": str(user_id),
                "primary_target": primary_target,
            },
        )
        response_body = CalendarEventDTO.to_response(
            google_event if isinstance(google_event, dict) else dict(google_event),
            calendar_event_row=calendar_event,
            create=True,
        )
        return jsonify({"success": True, "data": response_body}), 201

    except Exception as e:
        db.session.rollback()
        return handle_google_api_error(e, user_id, "create event")


@rate_limit(max_requests=50, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(GoogleCalendarEventCreateBody)
def update_event(event_id, data: GoogleCalendarEventCreateBody):
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
            return calendar_permission_response(error_response)

        event_data = dict(data.model_dump(mode="json", by_alias=True))
        event_data.pop("addGoogleMeet", None)
        event_data.pop("conferenceData", None)
        if not validate_event_data(event_data):
            return http_errors.validation("Invalid event data")

        itinerary_raw = event_data.pop("itinerary", None)
        itinerary_plain = itinerary_for_db(itinerary_raw)
        itinerary_db = None
        if itinerary_plain:
            try:
                itinerary_db = resolve_itinerary_with_route(itinerary_plain)
            except (ValueError, RuntimeError) as e:
                return itinerary_resolution_error(e)
            merge_viewing_itinerary_into_event_data(event_data, itinerary_db)

        calendar_id = extract_calendar_id_from_request(event_data)
        event = google_calendar_service.update_event(user_id, event_id, event_data, calendar_id)

        # Sync the updated event to the database
        sync_event_to_db(event_id, event, user_id, itinerary=itinerary_db)

        row = db.session.scalar(
            select(CalendarEvent).where(
                CalendarEvent.google_event_id == event_id,
                CalendarEvent.user_id == user_id,
            )
        )
        response_body = CalendarEventDTO.to_response(
            event if isinstance(event, dict) else dict(event),
            calendar_event_row=row,
        )

        return jsonify({"success": True, "data": response_body}), 200

    except Exception as e:
        return handle_google_api_error(e, user_id, "update event")


@rate_limit(max_requests=50, window_seconds=60)
@validate_response(DeleteEventResponse)
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
            return calendar_permission_response(error_response)
        calendar_id = request.args.get("calendarId", "primary")
        success = google_calendar_service.delete_event(user_id, event_id, calendar_id)

        # Delete the event from the database
        if success:
            delete_event_from_db(event_id, user_id)

        return jsonify({"success": True, "deleted": bool(success)}), 200

    except Exception as e:
        return handle_google_api_error(e, user_id, "delete event")


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
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
        agent_user = db.session.scalar(select(User).where(User.id == agent_id))
        if not agent_user or not user_is_agent(agent_user):
            return http_errors.forbidden()

        # Verify client exists and is connected to this agent
        client_user = db.session.scalar(select(User).where(User.id == client_id))
        if not client_user:
            return http_errors.not_found("Client not found")

        # Check if agent has connection with client
        connection = db.session.scalar(
            select(AgentConnections).where(
                AgentConnections.agent_id == agent_id,
                AgentConnections.client_id == client_id,
            )
        )

        if not connection:
            return http_errors.forbidden()

        # Get request parameters
        calendar_id = request.args.get("calendarId", "primary")
        time_min = request.args.get("timeMin")
        time_max = request.args.get("timeMax")
        max_results = validate_max_results(request.args.get("maxResults", "100"))

        if not time_min or not time_max:
            return http_errors.validation("timeMin and timeMax are required")

        perm_error = get_client_events_permission_error(client_id)
        if perm_error:
            return calendar_permission_response(perm_error)

        # List events for client's calendar (using client's user_id, not agent's)
        # This will use the client's credentials and resolve their calendar IDs
        events = google_calendar_service.list_events(
            client_id, calendar_id, time_min, time_max, max_results
        )

        # Ensure events is a list (handle None or unexpected response format)
        if events is None:
            events = []
        elif not isinstance(events, list):
            log.warn(
                "CALENDAR",
                "client_events_unexpected_format",
                {"client_id": str(client_id), "events_type": str(type(events))},
            )
            events = []

        events = CalendarEventDTO.enrich_events(client_id, events)

        return jsonify({"success": True, "data": {"items": events}})

    except Exception as e:
        return handle_google_api_error(e, agent_id, "list client events")
