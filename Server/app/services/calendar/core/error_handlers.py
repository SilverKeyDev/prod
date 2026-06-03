"""
Error handling helpers for Google Calendar routes
Extracts common error handling patterns
"""

import json
from collections.abc import Callable
from typing import Any

from flask import Response, jsonify
from googleapiclient.errors import HttpError

from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import (
    SecurityError,
    sanitize_error_message,
    security_error_response,
)
from logger import log


def extract_http_error_details(error: HttpError | Exception) -> dict[str, Any]:
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
    result = {"reason": None, "domain": None, "message": str(error), "errors": []}
    if not isinstance(error, HttpError):
        return result
    try:
        if hasattr(error, "content"):
            content = error.content
            if isinstance(content, bytes):
                content = content.decode("utf-8")
            if isinstance(content, str):
                error_data = json.loads(content)
            else:
                error_data = content
            if isinstance(error_data, dict):
                error_obj = error_data.get("error", {})
                result["message"] = error_obj.get("message", result["message"])
                errors = error_obj.get("errors", [])
                if errors and isinstance(errors, list) and (len(errors) > 0):
                    first_error = errors[0]
                    if isinstance(first_error, dict):
                        result["reason"] = first_error.get("reason")
                        result["domain"] = first_error.get("domain")
                        result["errors"] = errors
    except (AttributeError, json.JSONDecodeError, KeyError, TypeError) as e:
        log.debug("CALENDAR", f"Could not parse HttpError content: {e}")
    return result


def handle_google_api_error(
    error: Exception, user_id: str | None, operation: str, context: dict | None = None
) -> Response | tuple[Response, int]:
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
    if "GOOGLE_RECONNECT_REQUIRED" in error_msg:
        return security_error_response(SecurityError.GOOGLE_RECONNECT_REQUIRED)
    if isinstance(error, RuntimeError):
        log.warn("CALENDAR", f"RuntimeError in {operation} for user {user_id}: {error_msg}")
        is_calendar_access_issue = (
            "not found" in error_msg.lower()
            or "not accessible" in error_msg.lower()
            or ("calendar" in error_msg.lower() and "cannot access" in error_msg.lower())
        )
        if is_calendar_access_issue:
            return (
                jsonify({"success": False, "error": "calendar_not_found", "message": error_msg}),
                404,
            )
        else:
            return (
                jsonify({"success": False, "error": "authentication_failed", "message": error_msg}),
                401,
            )
    if isinstance(error, HttpError):
        error_details = extract_http_error_details(error)
        reason = error_details.get("reason")
        domain = error_details.get("domain")
        error_message = error_details.get("message", error_msg)
        try:
            sanitized_msg = sanitize_error_message(error)
        except (NameError, AttributeError, ImportError):
            sanitized_msg = str(error)
        log.error(
            "ERRORS",
            f"Google API error in {operation} for user {user_id}: {sanitized_msg} (reason: {reason}, domain: {domain})",
        )
        resp = getattr(error, "resp", None)
        if resp is not None:
            status_code = resp.status
            if status_code == 401:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "authentication_failed",
                            "message": "Google Calendar authentication failed. Please reconnect your account.",
                        }
                    ),
                    401,
                )
            elif status_code == 403:
                if reason == "quotaExceeded" and domain == "usageLimits":
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "quota_exceeded",
                                "message": "Google Calendar usage limit exceeded. Please wait before creating more calendars or events, or delete unused calendars to free up quota.",
                            }
                        ),
                        403,
                    )
                if (
                    reason == "insufficientPermissions"
                    or "insufficient authentication scopes" in error_message.lower()
                ):
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "permission_required",
                                "message": "Google Calendar authentication failed. Please reconnect your account with appropriate permissions.",
                                "reconnect_url": "/api/v1/google/oauth/start",
                            }
                        ),
                        403,
                    )
                if "calendar" in error_message.lower() or "permission" in error_message.lower():
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "calendar_access_denied",
                                "message": "Access denied to this calendar. You may not have permission to access it.",
                            }
                        ),
                        403,
                    )
                else:
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "authentication_failed",
                                "message": "Google Calendar authentication failed. Please reconnect your account.",
                            }
                        ),
                        401,
                    )
            elif status_code == 404:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "calendar_not_found",
                            "message": "Calendar not found or not accessible. If you're using a restricted scope, ensure your SilverKey calendar is set up.",
                        }
                    ),
                    404,
                )
        return SecureErrorHandler.handle_error(error, f"Failed to {operation}")
    log.error("ERRORS", f"Error in {operation} for user {user_id}: {error_msg}")
    return SecureErrorHandler.handle_error(error, f"Failed to {operation}")


def with_error_handling(operation: str, user_id: str | None = None) -> Callable:
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
