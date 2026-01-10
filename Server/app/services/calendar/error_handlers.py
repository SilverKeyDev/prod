"""
Error handling helpers for Google Calendar routes
Extracts common error handling patterns
"""

from typing import Callable, Any, Optional
from flask import Response, jsonify
from googleapiclient.errors import HttpError

from ...utils.security.security import security_error_response, SecurityError
from ...utils.security.secure_errors import SecureErrorHandler
from ...utils.security.app_logging import get_logger

logger = get_logger()


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
        logger.error(f"Google API error in {operation} for user {user_id}: {error_msg}", exc_info=True)
        
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
                # 403 = access denied (permissions issue, might be calendar-specific)
                error_msg = sanitize_error_message(error)
                # Check if it's a calendar access issue or general auth issue
                if "calendar" in error_msg.lower() or "permission" in error_msg.lower():
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
