"""Google Calendar list-events API call and error handling."""

from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.utils.security.app_logging import get_logger
from app.utils.security.security import (
    log_oauth_event,
    sanitize_error_message,
)

from ..core.credentials import load_credentials

logger = get_logger()


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
    # Resolve calendar_id (convert "primary" to SilverKey if using restricted scope)
    resolved_calendar_id = None
    try:
        resolved_calendar_id = resolve_calendar_id_func(user_id, calendar_id)
    except RuntimeError as e:
        # RuntimeError from resolve_calendar_id means we can't access primary with restricted scope
        # and SilverKey calendar creation failed - re-raise with clear message
        error_msg = sanitize_error_message(e)
        log_oauth_event(
            "events_list_error",
            user_id,
            calendar_id=calendar_id,
            error="calendar_resolution_failed",
        )
        logger.error(
            f"Failed to resolve calendar ID for user {user_id}, requested: {calendar_id}: {error_msg}"
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

        # Safely extract items from response
        if not events_response:
            logger.warning(
                f"Empty response from Google Calendar API for user {user_id}, calendar {resolved_calendar_id}"
            )
            return []

        items = events_response.get("items", [])
        if not isinstance(items, list):
            logger.warning(
                f"Unexpected items format from Google Calendar API for user {user_id}: {type(items)}"
            )
            return []

        log_oauth_event(
            "events_listed", user_id, calendar_id=resolved_calendar_id, count=len(items)
        )
        return items

    except RuntimeError as e:
        # Re-raise RuntimeError as-is (already has user-friendly message from resolve_calendar_id)
        raise e from e
    except Exception as e:
        # Handle 404 and 403 errors specifically - usually means calendar doesn't exist or isn't accessible
        resp = getattr(e, "resp", None) if isinstance(e, HttpError) else None
        if resp is not None and resp.status in [404, 403]:
            error_msg = sanitize_error_message(e)
            # Use resolved_calendar_id if available, otherwise fall back to calendar_id
            calendar_id_for_log = resolved_calendar_id if resolved_calendar_id else calendar_id

            # For 403, check error details to classify correctly
            if resp.status == 403:
                # Import error details extraction function
                from ..core.error_handlers import extract_http_error_details

                error_details = extract_http_error_details(e)
                reason = error_details.get("reason")
                domain = error_details.get("domain")
                error_message = error_details.get("message", error_msg)

                # Check for quota/usage limit errors
                if reason == "quotaExceeded" and domain == "usageLimits":
                    log_oauth_event(
                        "events_list_error",
                        user_id,
                        calendar_id=calendar_id_for_log,
                        error="quota_exceeded",
                    )
                    logger.warning(
                        f"Calendar quota exceeded for user {user_id}, calendar {calendar_id_for_log} "
                        f"(requested: {calendar_id}): {error_msg}"
                    )
                    raise RuntimeError(
                        "Google Calendar usage limit exceeded. "
                        "Please wait before making more requests or reduce calendar activity."
                    ) from e

                # Check for insufficient permissions/auth scope errors
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
                    logger.warning(
                        f"Calendar authentication failed for user {user_id}, calendar {calendar_id_for_log} "
                        f"(requested: {calendar_id}): {error_msg}"
                    )
                    raise RuntimeError(
                        "Google Calendar authentication failed. "
                        "Please reconnect your Google Calendar account with appropriate permissions."
                    ) from e

                # Generic calendar access denied
                log_oauth_event(
                    "events_list_error",
                    user_id,
                    calendar_id=calendar_id_for_log,
                    error="calendar_access_denied",
                )
                logger.warning(
                    f"Calendar access denied for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}"
                )
                raise RuntimeError(
                    f"Calendar '{calendar_id_for_log}' access denied. "
                    f"You may not have permission to access this calendar. "
                    f"Try using a different calendar or reconnect your Google Calendar account."
                ) from e

            # For 404, calendar doesn't exist or isn't accessible
            log_oauth_event(
                "events_list_error",
                user_id,
                calendar_id=calendar_id_for_log,
                error="calendar_not_found",
            )
            logger.warning(
                f"Calendar not found for user {user_id}, calendar {calendar_id_for_log} (requested: {calendar_id}): {error_msg}"
            )

            # If we tried to use "primary" and got 404, it means the user has restricted scope
            # and we should have resolved to SilverKey calendar but failed
            if calendar_id == "primary" and (
                not resolved_calendar_id or resolved_calendar_id == "primary"
            ):
                logger.error(
                    f"Failed to resolve 'primary' to SilverKey calendar for user {user_id} with restricted scope"
                )
                raise RuntimeError(
                    "Cannot access primary calendar with restricted scope. "
                    "Please ensure your SilverKey calendar is set up. "
                    "Try reconnecting your Google Calendar account."
                ) from e
            else:
                raise RuntimeError(
                    f"Calendar '{calendar_id_for_log}' not found or not accessible"
                ) from e

        error_msg = sanitize_error_message(e)
        log_oauth_event("events_list_error", user_id, calendar_id=calendar_id, error=error_msg)
        logger.error(
            f"Error listing events for user {user_id}, calendar {calendar_id}: {error_msg}",
            exc_info=True,
        )
        raise e from e
