"""
Error handling helpers for Google Calendar routes
Extracts common error handling patterns
"""

import json
from typing import Callable, Any, Optional, Dict
from flask import Response, jsonify
from googleapiclient.errors import HttpError

from app.utils.security.security import security_error_response, SecurityError, sanitize_error_message
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.app_logging import get_logger

logger = get_logger()


def extract_http_error_details(error: HttpError) -> Dict[str, Any]:
    """
    Extract error details from Google API HttpError.
    
    Google API errors have a structure like:
    {
        "error": {
            "errors": [
                {
                    "domain": "usageLimits",
                    "reason": "quotaExceeded",
                    "message": "..."
                }
            ],
            "code": 403,
            "message": "..."
        }
    }
    
    Args:
        error: HttpError from googleapiclient
        
    Returns:
        Dictionary with error details: {
            "reason": str or None,
            "domain": str or None,
            "message": str,
            "errors": list of error dicts
        }
    """
    result = {
        "reason": None,
        "domain": None,
        "message": str(error),
        "errors": []
    }
    
    try:
        # HttpError has a content attribute that contains the JSON response
        if hasattr(error, 'content'):
            content = error.content
            if isinstance(content, bytes):
                content = content.decode('utf-8')
            if isinstance(content, str):
                error_data = json.loads(content)
            else:
                error_data = content
            
            # Extract error details from the nested structure
            if isinstance(error_data, dict):
                error_obj = error_data.get("error", {})
                result["message"] = error_obj.get("message", result["message"])
                
                # Get the first error from the errors array (most common case)
                errors = error_obj.get("errors", [])
                if errors and isinstance(errors, list) and len(errors) > 0:
                    first_error = errors[0]
                    if isinstance(first_error, dict):
                        result["reason"] = first_error.get("reason")
                        result["domain"] = first_error.get("domain")
                        result["errors"] = errors
    except (AttributeError, json.JSONDecodeError, KeyError, TypeError) as e:
        # If parsing fails, fall back to string representation
        logger.debug(f"Could not parse HttpError content: {e}")
    
    return result


def handle_google_api_error(
    error: Exception,
    user_id: Optional[str],
    operation: str,
    context: Optional[dict] = None
) -> Response:
    """
    Handle Google Calendar API errors with consistent error responses.
    
    Args:
        error: The exception that occurred
        user_id: User ID for logging (optional)
        operation: Description of the operation that failed
        context: Additional context for logging (optional)
    
    Returns:
        Flask response with appropriate error message and status code
    """
    error_msg = str(error)
    
    # Check if this is a reconnection required error
    if "GOOGLE_RECONNECT_REQUIRED" in error_msg:
        return security_error_response(SecurityError.GOOGLE_RECONNECT_REQUIRED)
    
    # Handle RuntimeError (could be authentication/connection issues or calendar access issues)
    if isinstance(error, RuntimeError):
        logger.warning(f"RuntimeError in {operation} for user {user_id}: {error_msg}")
        
        # Check if this is a calendar access issue (404-like) vs authentication issue (401-like)
        # Calendar access issues typically mention "not found", "not accessible", or "calendar"
        is_calendar_access_issue = (
            "not found" in error_msg.lower() or
            "not accessible" in error_msg.lower() or
            ("calendar" in error_msg.lower() and "cannot access" in error_msg.lower())
        )
        
        if is_calendar_access_issue:
            # Calendar access issue - return 404
            return jsonify({
                "success": False,
                "error": "calendar_not_found",
                "message": error_msg
            }), 404
        else:
            # Authentication/connection issue - return 401
            return jsonify({
                "success": False,
                "error": "authentication_failed",
                "message": error_msg
            }), 401
    
    # Handle HttpError (Google API errors)
    if isinstance(error, HttpError):
        # Extract error details from HttpError content
        error_details = extract_http_error_details(error)
        reason = error_details.get("reason")
        domain = error_details.get("domain")
        error_message = error_details.get("message", error_msg)
        
        # Sanitize error message for logging
        try:
            sanitized_msg = sanitize_error_message(error)
        except (NameError, AttributeError, ImportError):
            sanitized_msg = str(error)
        
        logger.error(
            f"Google API error in {operation} for user {user_id}: {sanitized_msg} "
            f"(reason: {reason}, domain: {domain})",
            exc_info=True
        )
        
        # Check if it's an authentication/authorization error
        if hasattr(error, 'resp') and error.resp:
            status_code = error.resp.status
            if status_code == 401:
                # 401 = authentication failed (invalid/expired token)
                return jsonify({
                    "success": False,
                    "error": "authentication_failed",
                    "message": "Google Calendar authentication failed. Please reconnect your account."
                }), 401
            elif status_code == 403:
                # 403 = access denied - need to check reason and domain to classify correctly
                
                # Check for quota/usage limit errors
                if reason == "quotaExceeded" and domain == "usageLimits":
                    # Usage limit exceeded - don't tell them to reconnect
                    return jsonify({
                        "success": False,
                        "error": "quota_exceeded",
                        "message": "Google Calendar usage limit exceeded. Please wait before creating more calendars or events, or delete unused calendars to free up quota."
                    }), 403
                
                # Check for insufficient permissions/auth scope errors
                if reason == "insufficientPermissions" or "insufficient authentication scopes" in error_message.lower():
                    # Authentication/authorization scope problem
                    # Try to determine which permission is missing from context
                    # For now, return generic message with reconnect URL
                    return jsonify({
                        "success": False,
                        "error": "permission_required",
                        "message": "Google Calendar authentication failed. Please reconnect your account with appropriate permissions.",
                        "reconnect_url": "/api/v1/google-calendar/oauth/start?scheduling=true"
                    }), 403
                
                # Check if it's a calendar access issue or general auth issue
                if "calendar" in error_message.lower() or "permission" in error_message.lower():
                    return jsonify({
                        "success": False,
                        "error": "calendar_access_denied",
                        "message": "Access denied to this calendar. You may not have permission to access it."
                    }), 403
                else:
                    # General authentication/authorization failure
                    return jsonify({
                        "success": False,
                        "error": "authentication_failed",
                        "message": "Google Calendar authentication failed. Please reconnect your account."
                    }), 401
            elif status_code == 404:
                # Calendar not found - could be due to restricted scope trying to access primary
                return jsonify({
                    "success": False,
                    "error": "calendar_not_found",
                    "message": "Calendar not found or not accessible. If you're using a restricted scope, ensure your SilverKey calendar is set up."
                }), 404
        
        return SecureErrorHandler.handle_error(error, f"Failed to {operation}")
    
    # Handle generic exceptions
    logger.error(f"Error in {operation} for user {user_id}: {error_msg}", exc_info=True)
    return SecureErrorHandler.handle_error(error, f"Failed to {operation}")


def with_error_handling(
    operation: str,
    user_id: Optional[str] = None
) -> Callable:
    """
    Decorator to wrap route handlers with consistent error handling.
    
    Args:
        operation: Description of the operation (e.g., "list calendars")
        user_id: User ID for logging (optional, can be extracted from function)
    
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)
            except RuntimeError as e:
                return handle_google_api_error(e, user_id, operation)
            except HttpError as e:
                return handle_google_api_error(e, user_id, operation)
            except Exception as e:
                return handle_google_api_error(e, user_id, operation)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator
