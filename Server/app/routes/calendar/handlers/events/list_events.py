"""List events from the authenticated user's Google calendar."""

from flask import jsonify, make_response, request

from app.dtos.calendar import CalendarEventDTO
from app.schemas import GoogleCalendarApiResponse
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.events import validate_max_results
from app.utils.security.security import rate_limit
from app.utils.validation import validate_response
from logger import log


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
def list_events():
    """List events from user's Google calendar.

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

        events = google_calendar_service.list_events(
            user_id, calendar_id, time_min, time_max, max_results
        )

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
