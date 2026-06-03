"""Get or create the SilverKey calendar for a user."""

import time
from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app import db
from app.models import User
from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log

from ..core.credentials import load_credentials
from .calendar_delete import delete_calendar
from .calendar_management_constants import DELETE_DELAY_SECONDS
from .silverkey_owned_dedupe import (
    mark_silverkey_owned_dedupe_attempt,
    should_skip_silverkey_owned_dedupe,
)


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
        can_list_calendars = True
        silverkey_calendars = []
        all_named_silverkey: list[dict[str, Any]] = []
        try:
            calendar_list = service.calendarList().list().execute()
            items = calendar_list.get("items", [])
            all_named_silverkey = [
                cal for cal in items if cal.get("summary", "").startswith("SilverKey")
            ]
            silverkey_calendars = [
                cal for cal in all_named_silverkey if cal.get("accessRole") == "owner"
            ]
        except HttpError as e:
            if e.resp.status == 403:
                can_list_calendars = False
                log.debug(
                    "CALENDAR", f"User {user_id} has restricted scope (cannot list calendars)"
                )
                log_oauth_event(
                    "silverkey_calendar_list_skipped", user_id, reason="insufficient_scopes"
                )
            else:
                raise
        if can_list_calendars:
            if len(silverkey_calendars) == 0:
                if all_named_silverkey:
                    chosen = all_named_silverkey[0]
                    log.info(
                        "CALENDAR",
                        f"Using non-owned SilverKey calendar list entry for user {user_id} ({chosen.get('id')}); skipping create/delete",
                    )
                    log_oauth_event(
                        "silverkey_calendar_found", user_id, calendar_id=chosen.get("id")
                    )
                    return chosen
                log.info(
                    "CALENDAR", f"No SilverKey calendars found for user {user_id}, creating one"
                )
            elif len(silverkey_calendars) == 1:
                log_oauth_event(
                    "silverkey_calendar_found",
                    user_id,
                    calendar_id=silverkey_calendars[0].get("id"),
                )
                return silverkey_calendars[0]
            else:
                silverkey_calendars.sort(key=lambda x: x.get("id", ""))
                first_calendar = silverkey_calendars[0]
                calendars_to_delete = silverkey_calendars[1:]
                log.warn(
                    "CALENDAR",
                    f"Found {len(silverkey_calendars)} owned SilverKey calendars for user {user_id}. Keeping first calendar {first_calendar.get('id')} and deleting {len(calendars_to_delete)} duplicate(s)",
                )
                if should_skip_silverkey_owned_dedupe(user_id):
                    from .calendar_management_constants import SILVERKEY_OWNED_DEDUPE_COOLDOWN_SEC

                    log.info(
                        "CALENDAR",
                        f"Skipping SilverKey owned duplicate delete burst for user {user_id} (cooldown {SILVERKEY_OWNED_DEDUPE_COOLDOWN_SEC}s); returning primary owned calendar",
                    )
                    log_oauth_event(
                        "silverkey_calendar_found", user_id, calendar_id=first_calendar.get("id")
                    )
                    return first_calendar
                mark_silverkey_owned_dedupe_attempt(user_id)
                for index, cal in enumerate(calendars_to_delete):
                    cal_id = cal.get("id")
                    try:
                        if index > 0:
                            log.debug(
                                "CALENDAR",
                                f"Waiting {DELETE_DELAY_SECONDS} seconds before next calendar deletion to avoid rate limits",
                            )
                            time.sleep(DELETE_DELAY_SECONDS)
                        deleted = delete_calendar(
                            user_id, cal_id, client_id, client_secret, token_endpoint, scopes
                        )
                        if deleted:
                            log_oauth_event(
                                "silverkey_calendar_deleted_duplicate", user_id, calendar_id=cal_id
                            )
                            log.info(
                                "CALENDAR",
                                f"Deleted duplicate SilverKey calendar {cal_id} for user {user_id} ({index + 1}/{len(calendars_to_delete)})",
                            )
                        else:
                            log.warn(
                                "CALENDAR",
                                f"Duplicate SilverKey calendar {cal_id} not deleted for user {user_id} (permanent skip or non-owner)",
                            )
                    except Exception as delete_error:
                        error_msg = sanitize_error_message(delete_error)
                        log.warn(
                            "CALENDAR",
                            f"Failed to delete duplicate calendar {cal_id} for user {user_id}: {error_msg}. Continuing with remaining calendars.",
                        )
                        if index < len(calendars_to_delete) - 1:
                            time.sleep(DELETE_DELAY_SECONDS)
                log_oauth_event(
                    "silverkey_calendar_found", user_id, calendar_id=first_calendar.get("id")
                )
                return first_calendar
        user = db.session.get(User, user_id)
        if not user:
            log.warn(
                "CALENDAR", f"User {user_id} not found in database, using 'User' as default name"
            )
            user_name = "User"
        else:
            user_name = user.name if user.name else "User"
        calendar_name = f"SilverKey ~ {user_name}"
        calendar_body = {
            "summary": calendar_name,
            "description": "Calendar created by SilverKey for managing home tours and real estate events",
            "timeZone": "America/Los_Angeles",
        }
        try:
            created_calendar = service.calendars().insert(body=calendar_body).execute()
            log_oauth_event(
                "silverkey_calendar_created",
                user_id,
                calendar_id=created_calendar.get("id"),
                calendar_name=calendar_name,
            )
            log.info(
                "CALENDAR",
                f"Created SilverKey calendar {created_calendar.get('id')} for user {user_id}",
            )
            return created_calendar
        except HttpError as e:
            error_msg = sanitize_error_message(e)
            from ..core.error_handlers import extract_http_error_details

            if e.resp.status == 403:
                error_details = extract_http_error_details(e)
                reason = error_details.get("reason")
                domain = error_details.get("domain")
                if reason == "quotaExceeded" and domain == "usageLimits":
                    log_oauth_event(
                        "silverkey_calendar_create_quota_exceeded", user_id, error=error_msg
                    )
                    log.error(
                        "ERRORS",
                        f"Cannot create SilverKey calendar for user {user_id}: quota exceeded. Error: {error_msg}",
                    )
                    raise RuntimeError(
                        "Cannot create SilverKey calendar: Google Calendar usage limit exceeded. Please wait before creating more calendars, or delete unused calendars to free up quota."
                    ) from e
                if (
                    reason == "insufficientPermissions"
                    or "insufficient authentication scopes"
                    in error_details.get("message", "").lower()
                ):
                    log_oauth_event("silverkey_calendar_create_forbidden", user_id, error=error_msg)
                    log.error(
                        "ERRORS",
                        f"Cannot create SilverKey calendar for user {user_id}: insufficient permissions. User may need to reconnect with appropriate scopes. Error: {error_msg}",
                    )
                    raise RuntimeError(
                        "Cannot create SilverKey calendar: insufficient permissions. Please reconnect your Google Calendar account with appropriate permissions."
                    ) from e
                log_oauth_event("silverkey_calendar_create_forbidden", user_id, error=error_msg)
                log.error(
                    "ERRORS",
                    f"Cannot create SilverKey calendar for user {user_id}: access denied. Error: {error_msg}",
                )
                raise RuntimeError(
                    "Cannot create SilverKey calendar: access denied. Please check your Google Calendar permissions."
                ) from e
            else:
                log_oauth_event("silverkey_calendar_create_error", user_id, error=error_msg)
                log.error(
                    "ERRORS", f"Error creating SilverKey calendar for user {user_id}: {error_msg}"
                )
                raise
    except RuntimeError:
        raise
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("silverkey_calendar_error", user_id, error=error_msg)
        log.error(
            "ERRORS", f"Error getting/creating SilverKey calendar for user {user_id}: {error_msg}"
        )
        raise
