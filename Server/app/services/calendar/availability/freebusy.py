"""
Free/busy query operations for Google Calendar
Handles querying calendar availability
"""

from collections.abc import Callable
from typing import Any

from googleapiclient.discovery import build

from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log

from ..core.credentials import load_credentials


def query_freebusy(
    user_id: str,
    time_min: str,
    time_max: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    calendar_ids: list[str] | None = None,
    resolve_calendar_id_func: Callable[[str, str], str] | None = None,
) -> dict[str, Any]:
    """Query free/busy information for specified calendars

    Args:
        user_id: User ID
        time_min: Start time in ISO 8601 format
        time_max: End time in ISO 8601 format
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        calendar_ids: List of calendar IDs to check (defaults to ["primary"])
        resolve_calendar_id_func: Optional function to resolve calendar IDs (e.g., for restricted scope)

    Returns:
        Dictionary with calendar IDs as keys and busy time blocks as values
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        if not calendar_ids:
            calendar_ids = ["primary"]
        resolved_calendar_ids = []
        if resolve_calendar_id_func:
            for cal_id in calendar_ids:
                try:
                    resolved_id = resolve_calendar_id_func(user_id, cal_id)
                    resolved_calendar_ids.append(resolved_id)
                except RuntimeError as e:
                    error_msg = sanitize_error_message(e)
                    log.warn(
                        "CALENDAR",
                        f"Failed to resolve calendar ID {cal_id} for user {user_id}: {error_msg}",
                    )
                    continue
        else:
            resolved_calendar_ids = calendar_ids
        if not resolved_calendar_ids:
            log.warn("CALENDAR", f"No valid calendars to query for user {user_id} after resolution")
            return {}
        freebusy_request = {
            "timeMin": time_min,
            "timeMax": time_max,
            "items": [{"id": cal_id} for cal_id in resolved_calendar_ids],
        }
        freebusy_response = service.freebusy().query(body=freebusy_request).execute()
        log_oauth_event(
            "freebusy_queried",
            user_id,
            time_min=time_min,
            time_max=time_max,
            calendar_count=len(resolved_calendar_ids),
        )
        return freebusy_response.get("calendars", {})
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("freebusy_query_error", user_id, error=error_msg)
        log.error("ERRORS", f"Error querying freebusy for user {user_id}: {error_msg}")
        raise
