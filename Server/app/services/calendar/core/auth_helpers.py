"""
Authentication helpers for Google Calendar routes
Extracts common authentication patterns
"""

from flask import Response

from app.services.auth import get_current_user
from app.utils.security.app_logging import get_logger
from app.utils.security.security import SecurityError, security_error_response

logger = get_logger()


def get_authenticated_user() -> tuple[object | None, Response | None | tuple[Response, int]]:
    """
    Get the current authenticated user.

    Returns:
        Tuple of (user, error_response):
        - If successful: (user, None)
        - If authentication fails: (None, error_response) where error_response is (Response, status_code)
    """
    try:
        user = get_current_user()
        if not user:
            return None, security_error_response(SecurityError.UNAUTHORIZED)
        return user, None
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None, security_error_response(SecurityError.UNAUTHORIZED)


def get_authenticated_user_id() -> tuple[str | None, Response | None | tuple[Response, int]]:
    """
    Get the current authenticated user's ID.

    Returns:
        Tuple of (user_id, error_response):
        - If successful: (user_id, None)
        - If authentication fails: (None, error_response) where error_response is (Response, status_code)
    """
    user, error_response = get_authenticated_user()
    if error_response or user is None:
        return None, error_response or security_error_response(SecurityError.UNAUTHORIZED)
    return str(getattr(user, "id", "")), None
