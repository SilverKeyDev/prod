"""
Event operations for Google Calendar
Handles event listing, creation, updating, and deletion
"""

import copy
import uuid
from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.utils.security.app_logging import get_logger
from app.utils.security.security import (
    log_oauth_event,
    sanitize_error_message,
    validate_event_data,
)

from ..core.credentials import load_credentials
from .operations_list_events import list_events

logger = get_logger()


def _hangouts_meet_create_request() -> dict[str, Any]:
    """Fresh Meet request; never reuse requestId across events."""
    return {
        "createRequest": {
            "requestId": str(uuid.uuid4()),
            "conferenceSolutionKey": {"type": "hangoutsMeet"},
        }
    }


def _event_uses_datetime_start_end(body: dict[str, Any]) -> bool:
    """True when start/end are timed (dateTime). All-day events use date only — no Meet."""
    start = body.get("start") or {}
    end = body.get("end") or {}
    return bool(
        isinstance(start, dict)
        and isinstance(end, dict)
        and start.get("dateTime")
        and end.get("dateTime")
    )


def _calendar_insert(
    service: Any, resolved_calendar_id: str, body: dict[str, Any]
) -> dict[str, Any]:
    """Insert event; use conferenceDataVersion=1 when attaching Meet."""
    if body.get("conferenceData"):
        return (
            service.events()
            .insert(
                calendarId=resolved_calendar_id,
                body=body,
                conferenceDataVersion=1,
            )
            .execute()
        )
    return service.events().insert(calendarId=resolved_calendar_id, body=body).execute()


def create_event(
    user_id: str,
    event_data: dict[str, Any],
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func,
    target_user_id: str | None = None,
    *,
    add_google_meet: bool = False,
) -> dict[str, Any]:
    """Create a new event in user's Google calendar or target user's calendar

    Args:
        user_id: User ID (creator of the event)
        event_data: Event data dictionary (must not include client-supplied ``conferenceData``;
            callers should strip it before validate)
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID
        target_user_id: Optional target user ID to create event in their calendar instead
        add_google_meet: When True, attach a new Google Meet via ``conferenceData.createRequest``.
            On provisioning failure, retries once without Meet so the calendar event still saves.

    Returns:
        Created event dictionary
    """
    try:
        body = copy.deepcopy(event_data)
        # Never accept conferenceData from clients on create (security / no link reuse).
        body.pop("conferenceData", None)

        # Validate event data
        if not validate_event_data(body):
            raise ValueError("Invalid event data")

        meet_attempted = False
        if add_google_meet and _event_uses_datetime_start_end(body):
            body["conferenceData"] = _hangouts_meet_create_request()
            meet_attempted = True

        # If target_user_id is specified, create event in target user's calendar
        if target_user_id:
            # Use target user's credentials and calendar
            resolved_calendar_id = resolve_calendar_id_func(target_user_id, calendar_id)
            creds = load_credentials(
                target_user_id, client_id, client_secret, token_endpoint, scopes
            )
            log_oauth_event(
                "event_created_for_target", user_id, target_user_id=target_user_id, event_id=None
            )
        else:
            # Use creator's credentials and calendar
            resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
            creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)

        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        try:
            event = _calendar_insert(service, resolved_calendar_id, body)
        except HttpError as first_err:
            if meet_attempted and body.get("conferenceData"):
                logger.warning(
                    "Google Meet insert failed for user %s, retrying without conference: %s",
                    user_id,
                    sanitize_error_message(first_err),
                )
                body.pop("conferenceData", None)
                meet_attempted = False
                event = _calendar_insert(service, resolved_calendar_id, body)
            else:
                raise

        if target_user_id:
            log_oauth_event(
                "event_created", target_user_id, event_id=event.get("id"), created_by=user_id
            )
        else:
            log_oauth_event("event_created", user_id, event_id=event.get("id"))
        return event

    except Exception as e:
        error_msg = sanitize_error_message(e)
        if target_user_id:
            log_oauth_event(
                "event_create_error", user_id, target_user_id=target_user_id, error=error_msg
            )
            logger.error(
                f"Error creating event for user {user_id} in target {target_user_id}'s calendar: {error_msg}",
                exc_info=True,
            )
        else:
            log_oauth_event("event_create_error", user_id, error=error_msg)
            logger.error(f"Error creating event for user {user_id}: {error_msg}", exc_info=True)
        raise


def get_event(
    user_id: str,
    event_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func,
    target_user_id: str | None = None,
) -> dict[str, Any]:
    """Fetch a single event by id (same credential resolution as create/update)."""
    if target_user_id:
        resolved_calendar_id = resolve_calendar_id_func(target_user_id, calendar_id)
        creds = load_credentials(target_user_id, client_id, client_secret, token_endpoint, scopes)
    else:
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)

    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    return service.events().get(calendarId=resolved_calendar_id, eventId=event_id).execute()


def update_event(
    user_id: str,
    event_id: str,
    event_data: dict[str, Any],
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func,
) -> dict[str, Any]:
    """Update an existing event in user's Google calendar

    Args:
        user_id: User ID
        event_id: Event ID to update
        event_data: Updated event data dictionary
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID

    Returns:
        Updated event dictionary
    """
    try:
        # Validate event data
        if not validate_event_data(event_data):
            raise ValueError("Invalid event data")

        # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)

        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        event = (
            service.events()
            .update(calendarId=resolved_calendar_id, eventId=event_id, body=event_data)
            .execute()
        )

        log_oauth_event("event_updated", user_id, event_id=event.get("id"))
        return event

    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("event_update_error", user_id, event_id=event_id, error=error_msg)
        logger.error(
            f"Error updating event {event_id} for user {user_id}: {error_msg}", exc_info=True
        )
        raise


def delete_event(
    user_id: str,
    event_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    resolve_calendar_id_func,
) -> bool:
    """Delete an event from user's Google calendar

    Args:
        user_id: User ID
        event_id: Event ID to delete
        calendar_id: Calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        resolve_calendar_id_func: Function to resolve calendar ID

    Returns:
        True if successful
    """
    try:
        # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)

        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        service.events().delete(calendarId=resolved_calendar_id, eventId=event_id).execute()

        log_oauth_event("event_deleted", user_id, event_id=event_id)
        return True

    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("event_delete_error", user_id, event_id=event_id, error=error_msg)
        logger.error(
            f"Error deleting event {event_id} for user {user_id}: {error_msg}", exc_info=True
        )
        raise
