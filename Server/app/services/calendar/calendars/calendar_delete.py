"""Delete a Google Calendar for a user (with rate-limit retries)."""

import time

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log

from ..core.credentials import load_credentials
from .calendar_management_constants import MAX_RETRIES, RETRY_BASE_DELAY


def _http_error_delete_requires_owner_access(error: HttpError) -> bool:
    """True when calendars().delete is not allowed (e.g. subscribed calendar, not owner)."""
    if error.resp.status != 403:
        return False
    raw = getattr(error, "content", b"") or b""
    if isinstance(raw, bytes):
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = ""
    else:
        text = str(raw)
    lowered = text.lower()
    return "requiredaccesslevel" in lowered or "need to have owner access" in lowered


def delete_calendar(
    user_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    retry_count: int = 0,
) -> bool:
    """Delete a calendar for the user with rate limit handling

    Args:
        user_id: User ID
        calendar_id: Calendar ID to delete
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        retry_count: Current retry attempt (for exponential backoff)

    Returns:
        True if successful, False if the calendar cannot be deleted (e.g. not owner)
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        service.calendars().delete(calendarId=calendar_id).execute()
        log_oauth_event("calendar_deleted", user_id, calendar_id=calendar_id)
        log.info("CALENDAR", f"Deleted calendar {calendar_id} for user {user_id}")
        return True
    except HttpError as e:
        if e.resp.status == 404:
            log.debug(
                "CALENDAR",
                f"Calendar {calendar_id} not found for user {user_id} (may already be deleted)",
            )
            return True
        if e.resp.status == 403:
            from ..core.error_handlers import extract_http_error_details

            error_details = extract_http_error_details(e)
            reason = error_details.get("reason")
            if _http_error_delete_requires_owner_access(e):
                log.warn(
                    "CALENDAR",
                    f"Skipping calendar delete for {calendar_id}: user {user_id} is not the owner (use calendarList unsubscribe for subscribed calendars, not calendars.delete)",
                )
                log_oauth_event(
                    "calendar_delete_skipped_not_owner", user_id, calendar_id=calendar_id
                )
                return False
            if reason == "rateLimitExceeded" and retry_count < MAX_RETRIES:
                delay = RETRY_BASE_DELAY * 2**retry_count
                log.warn(
                    "CALENDAR",
                    f"Rate limit exceeded deleting calendar {calendar_id} for user {user_id}. Retrying in {delay} seconds (attempt {retry_count + 1}/{MAX_RETRIES})",
                )
                time.sleep(delay)
                return delete_calendar(
                    user_id,
                    calendar_id,
                    client_id,
                    client_secret,
                    token_endpoint,
                    scopes,
                    retry_count + 1,
                )
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_delete_error", user_id, calendar_id=calendar_id, error=error_msg)
        log.error(
            "ERRORS", f"Error deleting calendar {calendar_id} for user {user_id}: {error_msg}"
        )
        raise
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_delete_error", user_id, calendar_id=calendar_id, error=error_msg)
        log.error(
            "ERRORS", f"Error deleting calendar {calendar_id} for user {user_id}: {error_msg}"
        )
        raise
