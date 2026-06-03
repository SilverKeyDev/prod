"""
Availability query endpoints for Google Calendar
"""

from datetime import datetime
from typing import Any, cast

from flask import Response, jsonify, make_response
from sqlalchemy import select

from app import db
from app.models import AgentConnections, User
from app.routes.calendar.handlers.errors import calendar_permission_response
from app.schemas import ClientAvailabilityRequest, FreebusyRequest, GoogleCalendarApiResponse
from app.services.auth.user_role_helpers import user_is_agent
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.permissions import (
    check_permission,
    require_permission,
)
from app.services.calendar.permissions.constants import permissions
from app.utils.route import http_errors
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


def _aware_to_iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


@rate_limit(max_requests=100, window_seconds=60)
@validate_request(FreebusyRequest)
@validate_response(GoogleCalendarApiResponse)
def query_freebusy(data: FreebusyRequest) -> Response | tuple[Response, int]:
    """Query free/busy information for user's calendars"""
    user_id, error_response = get_authenticated_user_id()
    if error_response is not None:
        return cast(Response | tuple[Response, int], error_response)
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        time_min = _aware_to_iso(data.timeMin)
        time_max = _aware_to_iso(data.timeMax)
        calendar_ids = [item.id for item in data.items]

        if not time_min or not time_max:
            return http_errors.validation("timeMin and timeMax are required")

        has_freebusy = check_permission(user_id, "calendar_freebusy")
        if not has_freebusy:
            _ok, error_response = require_permission(
                user_id, "calendar_freebusy", context="query availability"
            )
            return calendar_permission_response(error_response)

        freebusy_result = google_calendar_service.query_freebusy(
            user_id, time_min, time_max, calendar_ids
        )

        return jsonify({"success": True, "data": {"calendars": freebusy_result}})

    except Exception as e:
        return handle_google_api_error(e, user_id, "query freebusy")


@rate_limit(max_requests=100, window_seconds=60)
@validate_request(ClientAvailabilityRequest)
@validate_response(GoogleCalendarApiResponse)
def query_client_availability(
    client_id: str, data: ClientAvailabilityRequest
) -> Response | tuple[Response, int]:
    """Query availability (free/busy) for a client's calendars

    This endpoint allows agents to view client availability without seeing specific event details.
    Only agents can access this endpoint.
    """
    agent_id, error_response = get_authenticated_user_id()
    if error_response is not None:
        return cast(Response | tuple[Response, int], error_response)

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

        time_min = _aware_to_iso(data.start_date)
        time_max = _aware_to_iso(data.end_date)
        calendar_ids = ["primary"]

        # Check if client has calendar_freebusy permission
        has_permission = check_permission(client_id, "calendar_freebusy")

        if not has_permission:
            # Build custom error message for agents viewing client availability
            # The client needs to connect/reconnect their Google Calendar with proper permissions
            perm_data = permissions.get("calendar_freebusy", {})
            description = perm_data.get("description", "View availability in calendars")

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

            return calendar_permission_response(
                {
                    "success": False,
                    "error": "client_permission_required",
                    "message": error_message,
                }
            )

        # Query freebusy for client's calendars (using client's user_id, not agent's)
        # This will use the client's credentials and resolve their calendar IDs
        freebusy_result = google_calendar_service.query_freebusy(
            client_id, time_min, time_max, calendar_ids, resolve_calendar_id=True
        )

        return jsonify({"success": True, "data": {"calendars": freebusy_result}})

    except Exception as e:
        return handle_google_api_error(e, agent_id, "query client availability")
