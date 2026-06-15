"""Create a Google Calendar event and persist to the database."""

from flask import jsonify, make_response
from sqlalchemy import select

from app import db
from app.dtos.calendar import CalendarEventDTO
from app.models import User
from app.routes.calendar.handlers.errors import calendar_permission_response
from app.schemas import GoogleCalendarApiResponse, GoogleCalendarEventCreateBody
from app.services.auth.user_role_helpers import user_is_agent
from app.services.calendar.core import (
    get_authenticated_user_id,
    handle_google_api_error,
)
from app.services.calendar.events import extract_calendar_id_from_request
from app.services.calendar.events.creation import (
    create_in_agent_calendars,
    create_primary_event_and_db,
    resolve_create_event_target,
)
from app.services.calendar.events.persistence import commit_created_calendar_events
from app.services.calendar.permissions import require_permission
from app.utils.route import http_errors
from app.utils.security.security import rate_limit, validate_event_data
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=50, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(GoogleCalendarEventCreateBody)
def create_event(data: GoogleCalendarEventCreateBody):
    """Create a new event in user's Google calendar and save to database."""
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

        current_user = db.session.scalar(select(User).where(User.id == user_id))
        result = resolve_create_event_target(user_id, event_data, current_user)
        event_data.pop("target_user_id", None)
        event_data.pop("create_in_agent_calendar", True)
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
        )

        commit_created_calendar_events(
            calendar_event,
            user_id=str(user_id),
            primary_target=str(primary_target),
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
