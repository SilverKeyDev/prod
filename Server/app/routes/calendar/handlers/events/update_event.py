"""Update an existing Google Calendar event."""

from flask import jsonify, make_response
from sqlalchemy import select

from app import db
from app.dtos.calendar import CalendarEventDTO
from app.models.calendar.calendar_event import CalendarEvent
from app.routes.calendar.handlers.errors import calendar_permission_response
from app.schemas import GoogleCalendarApiResponse, GoogleCalendarEventCreateBody
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.events import extract_calendar_id_from_request
from app.services.calendar.events.sync import sync_event_to_db
from app.services.calendar.permissions import require_permission
from app.utils.route import http_errors
from app.utils.security.security import rate_limit, validate_event_data
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=50, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(GoogleCalendarEventCreateBody)
def update_event(event_id, data: GoogleCalendarEventCreateBody):
    """Update an existing event in user's Google calendar."""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        has_permission, error_response = require_permission(
            user_id, "calendar_app_created", context="update events"
        )
        if not has_permission:
            return calendar_permission_response(error_response)

        event_data = dict(data.model_dump(mode="json", by_alias=True))
        add_google_meet_flag = event_data.pop("addGoogleMeet", None)
        event_data.pop("conferenceData", None)
        if not validate_event_data(event_data):
            return http_errors.validation("Invalid event data")

        calendar_id = extract_calendar_id_from_request(event_data)
        event = google_calendar_service.update_event(
            user_id,
            event_id,
            event_data,
            calendar_id,
            add_google_meet=add_google_meet_flag is True,
        )

        sync_event_to_db(
            event_id,
            event,
            user_id,
            add_google_meet=add_google_meet_flag,
        )

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
