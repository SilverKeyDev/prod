"""Delete a Google Calendar event."""

from flask import jsonify, make_response, request

from app.routes.calendar.handlers.errors import calendar_permission_response
from app.schemas import DeleteEventResponse
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.events.sync import delete_event_from_db
from app.services.calendar.permissions import require_permission
from app.utils.security.security import rate_limit
from app.utils.validation import validate_response


@rate_limit(max_requests=50, window_seconds=60)
@validate_response(DeleteEventResponse)
def delete_event(event_id):
    """Delete an event from user's Google calendar."""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        has_permission, error_response = require_permission(
            user_id, "calendar_app_created", context="delete events"
        )
        if not has_permission:
            return calendar_permission_response(error_response)
        calendar_id = request.args.get("calendarId", "primary")
        success = google_calendar_service.delete_event(user_id, event_id, calendar_id)

        if success:
            delete_event_from_db(event_id, user_id)

        return jsonify({"success": True, "deleted": bool(success)}), 200

    except Exception as e:
        return handle_google_api_error(e, user_id, "delete event")
