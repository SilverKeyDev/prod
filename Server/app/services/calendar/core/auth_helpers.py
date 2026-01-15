"""
Authentication helpers for Google Calendar routes
Extracts common authentication patterns
"""

from typing import Optional, Tuple
from flask import Response

from app.services.auth.current_user import get_current_user
from app.utils.security.security import security_error_response, SecurityError
from app.utils.security.app_logging import get_logger

logger = get_logger()


def get_authenticated_user() -> Tuple[Optional[object], Optional[Response]]:
    """
    Get the current authenticated user.
    
    Returns:
        Tuple of (user, error_response):
        - If successful: (user, None)
        - If authentication fails: (None, error_response)
    """
    try:
        user = get_current_user()
        if not user:
            return None, security_error_response(SecurityError.UNAUTHORIZED)
        return user, None
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None, security_error_response(SecurityError.UNAUTHORIZED)


def get_authenticated_user_id() -> Tuple[Optional[str], Optional[Response]]:
    """
    Get the current authenticated user's ID.
    
    Returns:
        Tuple of (user_id, error_response):
        - If successful: (user_id, None)
        - If authentication fails: (None, error_response)
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return None, error_response
    return str(user.id), None
