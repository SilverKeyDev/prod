"""
Calendar management endpoints for Google Calendar
"""

from typing import cast

from flask import Response, jsonify, make_response

from app.routes.calendar.handlers.errors import calendar_permission_response
from app.schemas import (
    AddCalendarACLRequest,
    CreateCalendarRequest,
    CreateSilverkeyCalendarRequest,
    GoogleCalendarApiResponse,
    Type,
)
from app.services.calendar.core import (
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
)
from app.services.calendar.permissions import require_permission
from app.utils.route import http_errors
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


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
def create_calendar(data: CreateCalendarRequest):
    """Create a secondary calendar (requires app-created calendar scope or broader)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        calendar_name = data.summary

        calendar = google_calendar_service.create_calendar(user_id, calendar_name)
        return jsonify({"success": True, "data": calendar}), 201

    except Exception as e:
        return handle_google_api_error(e, user_id, "create calendar")


@rate_limit(max_requests=10, window_seconds=60)
@validate_response(GoogleCalendarApiResponse)
@validate_request(AddCalendarACLRequest)
def add_calendar_acl(calendar_id, data: AddCalendarACLRequest):
    """Add an ACL rule to a calendar (grant agent access)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        ok, perm_err = require_permission(
            user_id,
            "calendar_app_created",
            "add sharing rules to your SilverKey calendar",
        )
        if not ok and perm_err:
            return calendar_permission_response(perm_err)

        scope = data.scope
        if scope.type != Type.user:
            return http_errors.validation("Only user scope is supported for agent ACL")
        if not scope.value:
            return http_errors.validation(
                "Agent email (scope.value) is required",
                field_errors={"scope.value": "Required"},
            )
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
    data: CreateSilverkeyCalendarRequest,
) -> Response | tuple[Response, int]:
    """Get or create the SilverKey calendar for the user"""
    user_id, error_response = get_authenticated_user_id()
    if error_response is not None:
        return cast(Response | tuple[Response, int], error_response)
    if user_id is None:
        return make_response(("Unauthorized", 401))

    try:
        buyer_name = None

        calendar = google_calendar_service.get_or_create_silverkey_calendar(user_id, buyer_name)
        return jsonify({"success": True, "data": calendar})

    except Exception as e:
        return handle_google_api_error(e, user_id, "get or create SilverKey calendar")
