"""
Google Calendar OAuth Routes
Handles OAuth flow and Calendar API operations
"""

from flask import Blueprint

# Import route handlers
from .handlers.health import health_check, connection_status
from .handlers.oauth import oauth_start, oauth_enhance, oauth_callback, revoke
from .handlers.calendars import (
    list_calendars,
    create_calendar,
    add_calendar_acl,
    get_or_create_silverkey_calendar,
)
from .handlers.events import (
    list_events,
    create_event,
    update_event,
    delete_event,
    list_client_events,
)
from .handlers.permissions import manage_permissions
from .handlers.availability import query_freebusy, query_client_availability
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
google_calendar_bp.route("/me/silverkey-calendar", methods=["GET", "POST"])(get_or_create_silverkey_calendar)

# Event endpoints
google_calendar_bp.route("/me/events", methods=["GET"])(list_events)
google_calendar_bp.route("/me/events", methods=["POST"])(create_event)
google_calendar_bp.route("/me/events/<event_id>", methods=["PATCH"])(update_event)
google_calendar_bp.route("/me/events/<event_id>", methods=["DELETE"])(delete_event)

# Permission endpoints
google_calendar_bp.route("/me/permissions", methods=["GET", "PUT"])(manage_permissions)

# Availability endpoints
google_calendar_bp.route("/me/freebusy", methods=["POST"])(query_freebusy)
google_calendar_bp.route("/clients/<client_id>/availability", methods=["POST"])(query_client_availability)

# Client events endpoint
google_calendar_bp.route("/clients/<client_id>/events", methods=["GET"])(list_client_events)

# Webhook endpoints
google_calendar_bp.route("/calendar/webhook", methods=["POST"])(calendar_webhook)
