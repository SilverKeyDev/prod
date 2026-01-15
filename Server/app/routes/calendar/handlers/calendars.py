"""
Calendar management endpoints for Google Calendar
"""

from flask import request, jsonify, make_response

from app.services.calendar.core import (
    google_calendar_service,
    get_authenticated_user_id,
    handle_google_api_error,
)
from app.utils.security.app_logging import get_logger
from app.utils.security.security import rate_limit

logger = get_logger()


@rate_limit(max_requests=100, window_seconds=60)
def list_calendars():
    """List user's Google calendars"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        calendars = google_calendar_service.list_calendars(user_id)
        return jsonify({
            "success": True,
            "data": {"items": calendars}
        })
    except Exception as e:
        return handle_google_api_error(e, user_id, "list calendars")


@rate_limit(max_requests=10, window_seconds=60)
def create_calendar():
    """Create a secondary calendar (requires full calendar scope)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        data = request.get_json()
        calendar_name = data.get("name")
        if not calendar_name:
            return make_response(("Calendar name is required", 400))
        
        calendar = google_calendar_service.create_calendar(user_id, calendar_name)
        return jsonify({
            "success": True,
            "data": calendar
        }), 201
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "create calendar")


@rate_limit(max_requests=10, window_seconds=60)
def add_calendar_acl(calendar_id):
    """Add an ACL rule to a calendar (grant agent access)"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        data = request.get_json()
        agent_email = data.get("agent_email")
        role = data.get("role", "writer")
        
        if not agent_email:
            return make_response(("Agent email is required", 400))
        
        acl_rule = google_calendar_service.add_calendar_acl(user_id, calendar_id, agent_email, role)
        return jsonify({
            "success": True,
            "data": acl_rule
        }), 201
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "add calendar ACL")


@rate_limit(max_requests=20, window_seconds=60)
def get_or_create_silverkey_calendar():
    """Get or create the SilverKey calendar for the user"""
    user_id, error_response = get_authenticated_user_id()
    if error_response:
        return error_response
    
    try:
        buyer_name = None
        if request.method == "POST":
            data = request.get_json()
            if data:
                buyer_name = data.get("buyerName")
        
        calendar = google_calendar_service.get_or_create_silverkey_calendar(user_id, buyer_name)
        return jsonify({
            "success": True,
            "data": calendar
        })
        
    except Exception as e:
        return handle_google_api_error(e, user_id, "get or create SilverKey calendar")
