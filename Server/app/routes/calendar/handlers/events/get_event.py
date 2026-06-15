"""Fetch a single Google Calendar event by id."""

from flask import jsonify, make_response, request
from sqlalchemy import select

from app import db
from app.dtos.calendar import CalendarEventDTO
from app.models.calendar.calendar_event import CalendarEvent
from app.routes.calendar.handlers.errors import calendar_permission_response
from app.schemas import GoogleCalendarApiResponse
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.permissions import require_permission
from app.utils.route import http_errors
from app.utils.security.security import rate_limit
from app.utils.validation import validate_response


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
