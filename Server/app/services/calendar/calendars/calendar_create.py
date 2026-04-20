"""Create a secondary Google Calendar for a user."""

from typing import Any

from googleapiclient.discovery import build

from app.utils.security.app_logging import get_logger
from app.utils.security.security import log_oauth_event, sanitize_error_message

from ..core.credentials import load_credentials

logger = get_logger()


def create_calendar(
    user_id: str,
    calendar_name: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
) -> dict[str, Any]:
    """Create a secondary calendar for the user (requires calendar.app.created or broader)

    Args:
        user_id: User ID
        calendar_name: Name for the new calendar
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list

    Returns:
        Created calendar dictionary
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        calendar_body = {
            "summary": calendar_name,
            "description": f"Calendar created by SilverKey for {calendar_name}",
            "timeZone": "America/Los_Angeles",  # Default, can be made configurable
        }

        created_calendar = service.calendars().insert(body=calendar_body).execute()

        log_oauth_event("calendar_created", user_id, calendar_id=created_calendar.get("id"))
        return created_calendar

    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_create_error", user_id, error=error_msg)
        logger.error(f"Error creating calendar for user {user_id}: {error_msg}", exc_info=True)
        raise
