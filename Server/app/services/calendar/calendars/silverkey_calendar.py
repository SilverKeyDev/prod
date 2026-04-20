"""Get or create the SilverKey calendar for a user."""

import time
from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app import db
from app.models import User
from app.utils.security.app_logging import get_logger
from app.utils.security.security import log_oauth_event, sanitize_error_message

from ..core.credentials import load_credentials
from .calendar_delete import delete_calendar
from .calendar_management_constants import DELETE_DELAY_SECONDS
from .silverkey_owned_dedupe import (
    mark_silverkey_owned_dedupe_attempt,
    should_skip_silverkey_owned_dedupe,
)

logger = get_logger()


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
        buyer_name: Optional override name (if None, fetches from User model)
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
        all_named_silverkey: list[dict[str, Any]] = []

        try:
            calendar_list = service.calendarList().list().execute()
            items = calendar_list.get("items", [])
            # Name match includes owned + subscribed copies; duplicate cleanup must be owner-only.
            all_named_silverkey = [
                cal for cal in items if cal.get("summary", "").startswith("SilverKey")
            ]
            silverkey_calendars = [
                cal for cal in all_named_silverkey if cal.get("accessRole") == "owner"
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
                if all_named_silverkey:
                    # Subscribed / shared "SilverKey" calendar only — not a duplicate of an owned copy.
                    chosen = all_named_silverkey[0]
                    logger.info(
                        f"Using non-owned SilverKey calendar list entry for user {user_id} "
                        f"({chosen.get('id')}); skipping create/delete"
                    )
                    log_oauth_event(
                        "silverkey_calendar_found",
                        user_id,
                        calendar_id=chosen.get("id"),
                    )
                    return chosen
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
                # Multiple owned calendars: keep the first one (by ID, which typically reflects creation order)
                # Sort by ID to get consistent ordering (earlier IDs are typically created first)
                silverkey_calendars.sort(key=lambda x: x.get("id", ""))
                first_calendar = silverkey_calendars[0]
                calendars_to_delete = silverkey_calendars[1:]

                logger.warning(
                    f"Found {len(silverkey_calendars)} owned SilverKey calendars for user {user_id}. "
                    f"Keeping first calendar {first_calendar.get('id')} and deleting {len(calendars_to_delete)} duplicate(s)"
                )

                if should_skip_silverkey_owned_dedupe(user_id):
                    from .calendar_management_constants import SILVERKEY_OWNED_DEDUPE_COOLDOWN_SEC

                    logger.info(
                        f"Skipping SilverKey owned duplicate delete burst for user {user_id} "
                        f"(cooldown {SILVERKEY_OWNED_DEDUPE_COOLDOWN_SEC}s); returning primary owned calendar"
                    )
                    log_oauth_event(
                        "silverkey_calendar_found",
                        user_id,
                        calendar_id=first_calendar.get("id"),
                    )
                    return first_calendar

                mark_silverkey_owned_dedupe_attempt(user_id)

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

                        deleted = delete_calendar(
                            user_id, cal_id, client_id, client_secret, token_endpoint, scopes
                        )
                        if deleted:
                            log_oauth_event(
                                "silverkey_calendar_deleted_duplicate", user_id, calendar_id=cal_id
                            )
                            logger.info(
                                f"Deleted duplicate SilverKey calendar {cal_id} for user {user_id} ({index + 1}/{len(calendars_to_delete)})"
                            )
                        else:
                            logger.warning(
                                f"Duplicate SilverKey calendar {cal_id} not deleted for user {user_id} "
                                f"(permanent skip or non-owner)"
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

        # Get user's name from database to create calendar name
        user = db.session.get(User, user_id)
        if not user:
            logger.warning(f"User {user_id} not found in database, using 'User' as default name")
            user_name = "User"
        else:
            user_name = user.name if user.name else "User"

        # Create new SilverKey calendar with format "SilverKey ~ [Name]"
        calendar_name = f"SilverKey ~ {user_name}"
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
