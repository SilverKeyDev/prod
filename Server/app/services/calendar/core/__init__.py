"""
Core calendar service infrastructure
"""

from .auth_helpers import get_authenticated_user, get_authenticated_user_id
from .credentials import load_credentials
from .error_handlers import extract_http_error_details, handle_google_api_error, with_error_handling


# Lazy import to avoid circular import: availability.freebusy -> core.credentials -> core -> service -> availability.freebusy
def __getattr__(name: str):
    if name in ("GoogleCalendarService", "google_calendar_service"):
        from .service import GoogleCalendarService, google_calendar_service

        return (
            google_calendar_service if name == "google_calendar_service" else GoogleCalendarService
        )
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    "GoogleCalendarService",
    "google_calendar_service",
    "load_credentials",
    "handle_google_api_error",
    "with_error_handling",
    "extract_http_error_details",
    "get_authenticated_user",
    "get_authenticated_user_id",
]
