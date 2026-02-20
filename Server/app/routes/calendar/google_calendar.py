"""
Google Calendar OAuth Routes
Handles OAuth flow and Calendar API operations
"""

from typing import cast

from flask import Blueprint, Response

from .handlers.availability import query_client_availability, query_freebusy
from .handlers.calendars import (
    add_calendar_acl,
    create_calendar,
    get_or_create_silverkey_calendar,
    list_calendars,
)
from .handlers.events import (
    create_event,
    delete_event,
    list_client_events,
    list_events,
    update_event,
)

# Import route handlers
from .handlers.health import connection_status, health_check
from .handlers.oauth import oauth_callback, oauth_enhance, oauth_start, revoke
from .handlers.permissions import manage_permissions
from .handlers.webhooks import calendar_webhook

# Create blueprint
google_calendar_bp = Blueprint("google_calendar", __name__, url_prefix="/api/v1/google")


# Health and status endpoints
google_calendar_bp.route("/health", methods=["GET"])(health_check)
google_calendar_bp.route("/connection-status", methods=["GET"])(connection_status)

# OAuth endpoints
google_calendar_bp.route("/oauth/start", methods=["GET"])(oauth_start)
google_calendar_bp.route("/oauth/enhance", methods=["GET"])(oauth_enhance)
google_calendar_bp.route("/oauth/callback", methods=["GET"])(oauth_callback)
google_calendar_bp.route("/oauth/revoke", methods=["POST"])(revoke)

# Calendar endpoints
google_calendar_bp.route("/me/calendars", methods=["GET"])(list_calendars)
google_calendar_bp.route("/calendars", methods=["POST"])(create_calendar)
google_calendar_bp.route("/calendars/<calendar_id>/acl", methods=["POST"])(add_calendar_acl)


def _silverkey_calendar_route() -> Response | tuple[Response, int]:
    """Wrapper so route() receives a handler with a return type that excludes None."""
    return cast(Response | tuple[Response, int], get_or_create_silverkey_calendar())


google_calendar_bp.route("/me/silverkey-calendar", methods=["GET", "POST"])(
    _silverkey_calendar_route
)

# Event endpoints
google_calendar_bp.route("/me/events", methods=["GET"])(list_events)
google_calendar_bp.route("/me/events", methods=["POST"])(create_event)
google_calendar_bp.route("/me/events/<event_id>", methods=["PATCH"])(update_event)
google_calendar_bp.route("/me/events/<event_id>", methods=["DELETE"])(delete_event)

# Permission endpoints


def _manage_permissions_route() -> Response | tuple[Response, int]:
    """Wrapper so route() receives a handler with a return type that excludes None."""
    return cast(Response | tuple[Response, int], manage_permissions())


google_calendar_bp.route("/me/permissions", methods=["GET", "PUT"])(_manage_permissions_route)  # type: ignore[reportArgumentType]

# Availability endpoints
google_calendar_bp.route("/me/freebusy", methods=["POST"])(query_freebusy)


def _client_availability_route(client_id: str) -> Response | tuple[Response, int]:
    """Wrapper so route() receives a handler with a return type that excludes None."""
    return cast(Response | tuple[Response, int], query_client_availability(client_id))


google_calendar_bp.route("/clients/<client_id>/availability", methods=["POST"])(
    _client_availability_route
)

# Client events endpoint
google_calendar_bp.route("/clients/<client_id>/events", methods=["GET"])(list_client_events)

# Webhook endpoints
google_calendar_bp.route("/calendar/webhook", methods=["POST"])(calendar_webhook)
