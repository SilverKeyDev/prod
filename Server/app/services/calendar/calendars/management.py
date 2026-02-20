"""
Calendar management operations for Google Calendar
Handles calendar creation and SilverKey calendar management
"""

import time
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

# Rate limiting constants
DELETE_DELAY_SECONDS = 1.0  # Delay between delete operations to avoid rate limits
MAX_RETRIES = 3  # Maximum retries for rate limit errors
RETRY_BASE_DELAY = 2.0  # Base delay for exponential backoff (seconds)


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
        True if successful
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        service.calendars().delete(calendarId=calendar_id).execute()

        log_oauth_event("calendar_deleted", user_id, calendar_id=calendar_id)
        logger.info(f"Deleted calendar {calendar_id} for user {user_id}")
        return True

    except HttpError as e:
        if e.resp.status == 404:
            # Calendar already deleted or doesn't exist
            logger.debug(
                f"Calendar {calendar_id} not found for user {user_id} (may already be deleted)"
            )
            return True

        # Handle rate limit errors with exponential backoff retry
        if e.resp.status == 403:
            from ..core.error_handlers import extract_http_error_details

            error_details = extract_http_error_details(e)
            reason = error_details.get("reason")

            if reason == "rateLimitExceeded" and retry_count < MAX_RETRIES:
                # Calculate exponential backoff delay
                delay = RETRY_BASE_DELAY * (2**retry_count)
                logger.warning(
                    f"Rate limit exceeded deleting calendar {calendar_id} for user {user_id}. "
                    f"Retrying in {delay} seconds (attempt {retry_count + 1}/{MAX_RETRIES})"
                )
                time.sleep(delay)
                # Retry with incremented retry count
                return delete_calendar(
                    user_id,
                    calendar_id,
                    client_id,
                    client_secret,
                    token_endpoint,
                    scopes,
                    retry_count + 1,
                )

        # For other errors or max retries reached, log and raise
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_delete_error", user_id, calendar_id=calendar_id, error=error_msg)
        logger.error(
            f"Error deleting calendar {calendar_id} for user {user_id}: {error_msg}", exc_info=True
        )
        raise
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendar_delete_error", user_id, calendar_id=calendar_id, error=error_msg)
        logger.error(
            f"Error deleting calendar {calendar_id} for user {user_id}: {error_msg}", exc_info=True
        )
        raise


def create_calendar(
    user_id: str,
    calendar_name: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
) -> dict[str, Any]:
    """Create a secondary calendar for the user (requires full calendar scope)

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


def get_or_create_silverkey_calendar(
    user_id: str,
    buyer_name: str | None,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
) -> dict[str, Any]:
    """Get or create the SilverKey calendar for a user

    Logic:
    - If 0 SilverKey calendars exist: create 1
    - If 1 SilverKey calendar exists: return it
    - If multiple SilverKey calendars exist: delete all but the first one (by creation time)

    Args:
        user_id: User ID
        buyer_name: Ignored - calendar is always named "SilverKey"
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list

    Returns:
        Calendar dictionary with id, summary, etc.
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        # Try to find existing SilverKey calendar (exact name match)
        # This will fail with 403 if user only has calendar.app.created scope
        can_list_calendars = True
        silverkey_calendars = []

        try:
            calendar_list = service.calendarList().list().execute()
            silverkey_calendars = [
                cal
                for cal in calendar_list.get("items", [])
                if cal.get("summary", "") == "SilverKey"
            ]
        except HttpError as e:
            # If we get 403 (insufficient scopes), we can't list calendars
            # This is expected with calendar.app.created scope - skip listing
            if e.resp.status == 403:
                can_list_calendars = False
                logger.debug(f"User {user_id} has restricted scope (cannot list calendars)")
                log_oauth_event(
                    "silverkey_calendar_list_skipped", user_id, reason="insufficient_scopes"
                )
            else:
                # Re-raise if it's a different error
                raise

        # Handle based on number of calendars found
        if can_list_calendars:
            if len(silverkey_calendars) == 0:
                # No calendars: create one
                logger.info(f"No SilverKey calendars found for user {user_id}, creating one")
            elif len(silverkey_calendars) == 1:
                # One calendar: return it
                log_oauth_event(
                    "silverkey_calendar_found",
                    user_id,
                    calendar_id=silverkey_calendars[0].get("id"),
                )
                return silverkey_calendars[0]
            else:
                # Multiple calendars: keep the first one (by ID, which typically reflects creation order)
                # Sort by ID to get consistent ordering (earlier IDs are typically created first)
                silverkey_calendars.sort(key=lambda x: x.get("id", ""))
                first_calendar = silverkey_calendars[0]
                calendars_to_delete = silverkey_calendars[1:]

                logger.warning(
                    f"Found {len(silverkey_calendars)} SilverKey calendars for user {user_id}. "
                    f"Keeping first calendar {first_calendar.get('id')} and deleting {len(calendars_to_delete)} duplicate(s)"
                )

                # Delete all but the first calendar with rate limiting
                for index, cal in enumerate(calendars_to_delete):
                    cal_id = cal.get("id")
                    try:
                        # Add delay before each delete (except the first one, which already has delay from previous operations)
                        if index > 0:
                            logger.debug(
                                f"Waiting {DELETE_DELAY_SECONDS} seconds before next calendar deletion to avoid rate limits"
                            )
                            time.sleep(DELETE_DELAY_SECONDS)

                        delete_calendar(
                            user_id, cal_id, client_id, client_secret, token_endpoint, scopes
                        )
                        log_oauth_event(
                            "silverkey_calendar_deleted_duplicate", user_id, calendar_id=cal_id
                        )
                        logger.info(
                            f"Deleted duplicate SilverKey calendar {cal_id} for user {user_id} ({index + 1}/{len(calendars_to_delete)})"
                        )
                    except Exception as delete_error:
                        error_msg = sanitize_error_message(delete_error)
                        logger.warning(
                            f"Failed to delete duplicate calendar {cal_id} for user {user_id}: {error_msg}. "
                            f"Continuing with remaining calendars."
                        )
                        # Continue deleting other calendars even if one fails
                        # Still add delay before next attempt to avoid compounding rate limit issues
                        if index < len(calendars_to_delete) - 1:
                            time.sleep(DELETE_DELAY_SECONDS)

                # Return the first calendar
                log_oauth_event(
                    "silverkey_calendar_found", user_id, calendar_id=first_calendar.get("id")
                )
                return first_calendar

        # If we can't list calendars (403 error), we need to try creating
        # But first, try to get calendar details by attempting to create and catching "already exists" errors
        # Actually, with calendar.app.created scope, we can't check if calendar exists
        # So we'll try to create, and if it fails with "already exists" or quota error, we'll handle it
        # However, Google Calendar API doesn't return "already exists" - it just creates duplicates
        # So with restricted scope, we can't prevent duplicates. We'll create and hope for the best.
        # The user will need full scope to properly manage duplicates.

        # Create new SilverKey calendar with exact name "SilverKey"
        calendar_name = "SilverKey"
        calendar_body = {
            "summary": calendar_name,
            "description": "Calendar created by SilverKey for managing home tours and real estate events",
            "timeZone": "America/Los_Angeles",  # Default, can be made configurable
        }

        try:
            created_calendar = service.calendars().insert(body=calendar_body).execute()

            log_oauth_event(
                "silverkey_calendar_created",
                user_id,
                calendar_id=created_calendar.get("id"),
                calendar_name=calendar_name,
            )
            logger.info(
                f"Created SilverKey calendar {created_calendar.get('id')} for user {user_id}"
            )
            return created_calendar
        except HttpError as e:
            # Handle specific HTTP errors during calendar creation
            error_msg = sanitize_error_message(e)

            # Import error details extraction function
            from ..core.error_handlers import extract_http_error_details

            if e.resp.status == 403:
                # Extract error details to classify correctly
                error_details = extract_http_error_details(e)
                reason = error_details.get("reason")
                domain = error_details.get("domain")

                # Check for quota/usage limit errors
                if reason == "quotaExceeded" and domain == "usageLimits":
                    log_oauth_event(
                        "silverkey_calendar_create_quota_exceeded", user_id, error=error_msg
                    )
                    logger.error(
                        f"Cannot create SilverKey calendar for user {user_id}: quota exceeded. "
                        f"Error: {error_msg}"
                    )
                    raise RuntimeError(
                        "Cannot create SilverKey calendar: Google Calendar usage limit exceeded. "
                        "Please wait before creating more calendars, or delete unused calendars to free up quota."
                    ) from e

                # Check for insufficient permissions/auth scope errors
                if (
                    reason == "insufficientPermissions"
                    or "insufficient authentication scopes"
                    in error_details.get("message", "").lower()
                ):
                    log_oauth_event("silverkey_calendar_create_forbidden", user_id, error=error_msg)
                    logger.error(
                        f"Cannot create SilverKey calendar for user {user_id}: insufficient permissions. "
                        f"User may need to reconnect with appropriate scopes. Error: {error_msg}"
                    )
                    raise RuntimeError(
                        "Cannot create SilverKey calendar: insufficient permissions. "
                        "Please reconnect your Google Calendar account with appropriate permissions."
                    ) from e

                # Generic 403 error
                log_oauth_event("silverkey_calendar_create_forbidden", user_id, error=error_msg)
                logger.error(
                    f"Cannot create SilverKey calendar for user {user_id}: access denied. "
                    f"Error: {error_msg}"
                )
                raise RuntimeError(
                    "Cannot create SilverKey calendar: access denied. "
                    "Please check your Google Calendar permissions."
                ) from e
            else:
                log_oauth_event("silverkey_calendar_create_error", user_id, error=error_msg)
                logger.error(
                    f"Error creating SilverKey calendar for user {user_id}: {error_msg}",
                    exc_info=True,
                )
                raise

    except RuntimeError:
        # Re-raise RuntimeError as-is (already has user-friendly message)
        raise
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("silverkey_calendar_error", user_id, error=error_msg)
        logger.error(
            f"Error getting/creating SilverKey calendar for user {user_id}: {error_msg}",
            exc_info=True,
        )
        raise
