"""
Availability query endpoints for Google Calendar
"""

from datetime import datetime
from typing import Any, cast

from flask import Response, jsonify, make_response, request

from app.models import AgentConnections, User
from app.schemas import ClientAvailabilityRequest, FreebusyRequest, GoogleCalendarApiResponse
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
from app.utils.security.app_logging import get_logger
from app.utils.security.security import rate_limit
from app.utils.validation import validate_request, validate_response

logger = get_logger()


def _aware_to_iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


@rate_limit(max_requests=100, window_seconds=60)
@validate_request(FreebusyRequest)
@validate_response(GoogleCalendarApiResponse)
def query_freebusy(data: FreebusyRequest | None = None) -> Response | tuple[Response, int]:
    """Query free/busy information for user's calendars"""
    user_id, error_response = get_authenticated_user_id()
    if error_response is not None:
        return cast(Response | tuple[Response, int], error_response)
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        if data is None:
            raw = request.get_json(silent=True) or {}
            if not raw:
                return make_response(("Request body is required", 400))
            time_min = raw.get("timeMin")
            time_max = raw.get("timeMax")
            calendar_ids = raw.get("calendarIds", ["primary"])
            if not time_min or not time_max:
                return make_response(("timeMin and timeMax are required", 400))
        else:
            time_min = _aware_to_iso(data.timeMin)
            time_max = _aware_to_iso(data.timeMax)
            calendar_ids = [item.id for item in data.items]

        if not time_min or not time_max:
            return make_response(("timeMin and timeMax are required", 400))

        # Check if user has calendar_freebusy or calendar_events_freebusy permission
        has_freebusy = check_permission(user_id, "calendar_freebusy")
        has_events_freebusy = check_permission(user_id, "calendar_events_freebusy")

        if not has_freebusy and not has_events_freebusy:
            # Return error response
            has_permission, error_response = require_permission(
                user_id, "calendar_freebusy", context="query availability"
            )
            return jsonify(error_response), 403

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
    client_id: str, data: ClientAvailabilityRequest | None = None
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
        agent_user = User.query.filter_by(id=agent_id).first()
        if not agent_user or not agent_user.is_agent:
            return jsonify(
                {
                    "success": False,
                    "error": "unauthorized",
                    "message": "Only agents can access client availability",
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

        if data is None:
            raw = request.get_json(silent=True) or {}
            if not raw:
                return make_response(("Request body is required", 400))
            time_min = raw.get("timeMin")
            time_max = raw.get("timeMax")
            calendar_ids = raw.get("calendarIds", ["primary"])
            if not time_min or not time_max:
                return make_response(("timeMin and timeMax are required", 400))
        else:
            time_min = _aware_to_iso(data.start_date)
            time_max = _aware_to_iso(data.end_date)
            raw = request.get_json(silent=True) or {}
            calendar_ids = raw.get("calendarIds", ["primary"])

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

            return jsonify(
                {
                    "success": False,
                    "error": "client_permission_required",
                    "message": error_message,
                    "required_permission": "calendar_freebusy",
                    "client_id": client_id,
                    "client_has_connection": client_has_connection,
                }
            ), 403

        # Query freebusy for client's calendars (using client's user_id, not agent's)
        # This will use the client's credentials and resolve their calendar IDs
        freebusy_result = google_calendar_service.query_freebusy(
            client_id, time_min, time_max, calendar_ids, resolve_calendar_id=True
        )

        return jsonify({"success": True, "data": {"calendars": freebusy_result}})

    except Exception as e:
        return handle_google_api_error(e, agent_id, "query client availability")
