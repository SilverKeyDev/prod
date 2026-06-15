"""List events from a connected client's Google calendar (agent-only)."""

from flask import jsonify, make_response, request
from sqlalchemy import select

from app import db
from app.dtos.calendar import CalendarEventDTO
from app.models import AgentConnections, User
from app.routes.calendar.handlers.errors import calendar_permission_response
from app.schemas import GoogleCalendarApiResponse
from app.services.auth.user_role_helpers import user_is_agent
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.events import validate_max_results
from app.services.calendar.events.creation import get_client_events_permission_error
from app.utils.route import http_errors
from app.utils.security.security import rate_limit
from app.utils.validation import validate_response
from logger import log


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
def list_client_events(client_id: str):
    """List events from a client's Google calendar (agents only)."""
    agent_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if agent_id is None:
        return make_response(("Unauthorized", 401))

    try:
        agent_user = db.session.scalar(select(User).where(User.id == agent_id))
        if not agent_user or not user_is_agent(agent_user):
            return http_errors.forbidden()

        client_user = db.session.scalar(select(User).where(User.id == client_id))
        if not client_user:
            return http_errors.not_found("Client not found")

        connection = db.session.scalar(
            select(AgentConnections).where(
                AgentConnections.agent_id == agent_id,
                AgentConnections.client_id == client_id,
            )
        )

        if not connection:
            return http_errors.forbidden()

        calendar_id = request.args.get("calendarId", "primary")
        time_min = request.args.get("timeMin")
        time_max = request.args.get("timeMax")
        max_results = validate_max_results(request.args.get("maxResults", "100"))

        if not time_min or not time_max:
            return http_errors.validation("timeMin and timeMax are required")

        perm_error = get_client_events_permission_error(client_id)
        if perm_error:
            return calendar_permission_response(perm_error)

        events = google_calendar_service.list_events(
            client_id, calendar_id, time_min, time_max, max_results
        )

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
