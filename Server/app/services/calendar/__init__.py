"""
Calendar service helpers
Provides authentication, error handling, and event utilities for Google Calendar routes
"""

from .auth_helpers import get_authenticated_user, get_authenticated_user_id
from .error_handlers import handle_google_api_error, with_error_handling
from .event_helpers import (
    parse_google_datetime,
    extract_event_datetimes,
    validate_max_results,
    extract_calendar_id_from_request
)

__all__ = [
    "get_authenticated_user",
    "get_authenticated_user_id",
    "handle_google_api_error",
    "with_error_handling",
    "parse_google_datetime",
    "extract_event_datetimes",
    "validate_max_results",
    "extract_calendar_id_from_request",
]
