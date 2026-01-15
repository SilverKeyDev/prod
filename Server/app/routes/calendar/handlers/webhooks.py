"""
Webhook endpoints for Google Calendar
"""

from flask import request, jsonify, make_response

from app.utils.security.security import log_oauth_event

def calendar_webhook():
    """Handle Google Calendar webhook notifications"""
    # Validate headers
    resource_state = request.headers.get("X-Goog-Resource-State")
    resource_id = request.headers.get("X-Goog-Resource-Id")
    
    if not resource_state or not resource_id:
        return make_response(("Missing webhook headers", 400))
    
    # Log webhook event
    log_oauth_event("webhook_received", None, 
                   resource_state=resource_state, 
                   resource_id=resource_id)
    
    # TODO: Implement webhook processing logic
    # This could include:
    # - Updating local cache
    # - Notifying frontend via WebSocket
    # - Triggering other business logic
    
    return jsonify({"ok": True})
