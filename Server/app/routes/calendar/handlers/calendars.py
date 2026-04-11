"""
Calendar management endpoints for Google Calendar
"""

from typing import cast

from flask import Response, jsonify, make_response, request

from app.schemas import (
    AddCalendarACLRequest,
    CreateCalendarRequest,
    CreateSilverkeyCalendarRequest,
    GoogleCalendarApiResponse,
    Type3,
)
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.utils.security.app_logging import get_logger
from app.utils.security.security import rate_limit
from app.utils.validation import validate_request, validate_response

logger = get_logger()


@rate_limit(max_requests=100, window_seconds=60)
def list_calendars():
    """List user's Google calendars"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        calendars = google_calendar_service.list_calendars(user_id)
        return jsonify({"success": True, "data": {"items": calendars}})
    except Exception as e:
        return handle_google_api_error(e, user_id, "list calendars")


@rate_limit(max_requests=10, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(CreateCalendarRequest)
def create_calendar(data: CreateCalendarRequest | None = None):
    """Create a secondary calendar (requires full calendar scope)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        if data is None:
            raw = request.get_json(silent=True) or {}
            calendar_name = raw.get("summary") or raw.get("name")
            if not calendar_name:
                return make_response(("Calendar name is required", 400))
        else:
            calendar_name = data.summary

        calendar = google_calendar_service.create_calendar(user_id, calendar_name)
        return jsonify({"success": True, "data": calendar}), 201

    except Exception as e:
        return handle_google_api_error(e, user_id, "create calendar")


@rate_limit(max_requests=10, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(AddCalendarACLRequest)
def add_calendar_acl(calendar_id, data: AddCalendarACLRequest | None = None):
    """Add an ACL rule to a calendar (grant agent access)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        if data is None:
            raw = request.get_json(silent=True) or {}
            agent_email = raw.get("agent_email")
            role = raw.get("role", "writer")
            if not agent_email:
                return make_response(("Agent email is required", 400))
        else:
            scope = data.scope
            if scope.type != Type3.user:
                return make_response(("Only user scope is supported for agent ACL", 400))
            if not scope.value:
                return make_response(("Agent email (scope.value) is required", 400))
            agent_email = scope.value
            role = data.role.value

        acl_rule = google_calendar_service.add_calendar_acl(user_id, calendar_id, agent_email, role)
        return jsonify({"success": True, "data": acl_rule}), 201

    except Exception as e:
        return handle_google_api_error(e, user_id, "add calendar ACL")


@rate_limit(max_requests=20, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(CreateSilverkeyCalendarRequest)
def get_or_create_silverkey_calendar(
    data: CreateSilverkeyCalendarRequest | None = None,
) -> Response | tuple[Response, int]:
    """Get or create the SilverKey calendar for the user"""
    user_id, error_response = get_authenticated_user_id()
    if error_response is not None:
        return cast(Response | tuple[Response, int], error_response)
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        buyer_name = None
        if request.method == "POST":
            if data is None:
                raw = request.get_json(silent=True) or {}
                if raw:
                    buyer_name = raw.get("buyerName")
            # OpenAPI body only includes `force`; buyerName remains a legacy optional field.

        calendar = google_calendar_service.get_or_create_silverkey_calendar(user_id, buyer_name)
        return jsonify({"success": True, "data": calendar})

    except Exception as e:
        return handle_google_api_error(e, user_id, "get or create SilverKey calendar")
