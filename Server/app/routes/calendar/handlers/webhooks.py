"""
Webhook endpoints for Google Calendar push notifications.
"""

from flask import jsonify, make_response, request

from app.schemas import GoogleCalendarWebhookBody
from app.services.calendar.webhooks import verify_calendar_webhook
from app.utils.security.security import log_oauth_event, rate_limit
from app.utils.validation import validate_request


@rate_limit(max_requests=120, window_seconds=60, per="ip")
@validate_request(GoogleCalendarWebhookBody)
def calendar_webhook(_data: GoogleCalendarWebhookBody):
    """Handle Google Calendar webhook notifications."""
    resource_state = request.headers.get("X-Goog-Resource-State")
    resource_id = request.headers.get("X-Goog-Resource-Id")
    channel_token = request.headers.get("X-Goog-Channel-Token")
    channel_id = request.headers.get("X-Goog-Channel-ID")

    if not verify_calendar_webhook(
        channel_token=channel_token,
        channel_id=channel_id,
        resource_id=resource_id,
        resource_state=resource_state,
    ):
        return make_response(("Unauthorized", 401))

    log_oauth_event(
        "webhook_received",
        None,
        resource_state=resource_state,
        resource_id=resource_id,
        channel_id=channel_id,
    )

    return jsonify({"ok": True})
