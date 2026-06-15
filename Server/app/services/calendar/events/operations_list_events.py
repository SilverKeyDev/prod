"""Google Calendar list-events API call and error handling."""

from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log

from ..core.credentials import load_credentials


def list_events(
    user_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func,
    time_min: str | None = None,
    time_max: str | None = None,
    max_results: int = 100,
) -> list[dict[str, Any]]:
    """List events from user's Google calendar

    Args:
        user_id: User ID
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID
        time_min: Optional start time in ISO 8601 format
        time_max: Optional end time in ISO 8601 format
        max_results: Maximum number of results to return

    Returns:
        List of event dictionaries
    """
    resolved_calendar_id = None
    try:
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
    except RuntimeError as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event(
            "events_list_error",
            user_id,
            calendar_id=calendar_id,
            error="calendar_resolution_failed",
        )
        log.error(
            "ERRORS",
            f"Failed to resolve calendar ID for user {user_id}, requested: {calendar_id}: {error_msg}",
        )
        raise
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        params = {
            "calendarId": resolved_calendar_id,
            "maxResults": max_results,
            "singleEvents": True,
            "orderBy": "startTime",
        }
        if time_min:
            params["timeMin"] = time_min
        if time_max:
            params["timeMax"] = time_max
        events_response = service.events().list(**params).execute()
        if not events_response:
            log.warn(
                "CALENDAR",
                f"Empty response from Google Calendar API for user {user_id}, calendar {resolved_calendar_id}",
            )
            return []
        items = events_response.get("items", [])
        if not isinstance(items, list):
            log.warn(
                "CALENDAR",
                f"Unexpected items format from Google Calendar API for user {user_id}: {type(items)}",
            )
            return []
        log_oauth_event(
            "events_listed", user_id, calendar_id=resolved_calendar_id, count=len(items)
        )
        return items
    except RuntimeError as e:
        raise e from e
    except Exception as e:
        resp = getattr(e, "resp", None) if isinstance(e, HttpError) else None
        if resp is not None and resp.status in [404, 403]:
            error_msg = sanitize_error_message(e)
            calendar_id_for_log = resolved_calendar_id if resolved_calendar_id else calendar_id
            if resp.status == 403:
                from ..core.error_handlers import extract_http_error_details

                error_details = extract_http_error_details(e)
                reason = error_details.get("reason")
                domain = error_details.get("domain")
                error_message = error_details.get("message", error_msg)
                if reason == "quotaExceeded" and domain == "usageLimits":
                    log_oauth_event(
                        "events_list_error",
                        user_id,
                        calendar_id=calendar_id_for_log,
                        error="quota_exceeded",
                    )
                    log.warn(
                        "CALENDAR",
                        f"Calendar quota exceeded for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}",
                    )
                    raise RuntimeError(
                        "Google Calendar usage limit exceeded. Please wait before making more requests or reduce calendar activity."
                    ) from e
                if (
                    reason == "insufficientPermissions"
                    or "insufficient authentication scopes" in error_message.lower()
                ):
                    log_oauth_event(
                        "events_list_error",
                        user_id,
                        calendar_id=calendar_id_for_log,
                        error="authentication_failed",
                    )
                    log.warn(
                        "CALENDAR",
                        f"Calendar authentication failed for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}",
                    )
                    raise RuntimeError(
                        "Google Calendar authentication failed. Please reconnect your Google Calendar account with appropriate permissions."
                    ) from e
                log_oauth_event(
                    "events_list_error",
                    user_id,
                    calendar_id=calendar_id_for_log,
                    error="calendar_access_denied",
                )
                log.warn(
                    "CALENDAR",
                    f"Calendar access denied for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}",
                )
                raise RuntimeError(
                    f"Calendar '{calendar_id_for_log}' access denied. You may not have permission to access this calendar. Try using a different calendar or reconnect your Google Calendar account."
                ) from e
            log_oauth_event(
                "events_list_error",
                user_id,
                calendar_id=calendar_id_for_log,
                error="calendar_not_found",
            )
            log.warn(
                "CALENDAR",
                f"Calendar not found for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}",
            )
            if calendar_id == "primary" and (
                not resolved_calendar_id or resolved_calendar_id == "primary"
            ):
                log.error(
                    "ERRORS",
                    f"Failed to resolve 'primary' to SilverKey calendar for user {user_id} with restricted scope",
                )
                raise RuntimeError(
                    "Cannot access primary calendar with restricted scope. Please ensure your SilverKey calendar is set up. Try reconnecting your Google Calendar account."
                ) from e
            else:
                raise RuntimeError(
                    f"Calendar '{calendar_id_for_log}' not found or not accessible"
                ) from e
        error_msg = sanitize_error_message(e)
        log_oauth_event("events_list_error", user_id, calendar_id=calendar_id, error=error_msg)
        log.error(
            "ERRORS",
            f"Error listing events for user {user_id}, calendar {calendar_id}: {error_msg}",
        )
        raise e from e
