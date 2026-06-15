"""
Calendar resolution and listing operations for Google Calendar
Handles calendar ID resolution and calendar listing
"""

from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.services.auth.tokens import tokens_get
from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log

from ..core.credentials import load_credentials


def resolve_calendar_id(
    user_id: str,
    calendar_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    get_or_create_silverkey_calendar_func,
) -> str:
    """Resolve calendar ID based on user's scopes

    If user has calendar.app.created scope (restricted) and requests "primary",
    automatically use SilverKey calendar instead since primary calendar is not accessible.

    Args:
        user_id: User ID
        calendar_id: Requested calendar ID (may be "primary")
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        get_or_create_silverkey_calendar_func: Function to get or create SilverKey calendar

    Returns:
        Resolved calendar ID (SilverKey calendar ID if restricted scope and primary requested)
    """
    if calendar_id == "primary":
        from app.services.calendar.permissions.constants import permissions

        token_data = tokens_get(user_id)
        if token_data:
            stored_scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else []
            calendar_app_created_scope = permissions["calendar_app_created"]["scope_url"]
            has_restricted_scope = calendar_app_created_scope in stored_scopes
            if has_restricted_scope:
                try:
                    silverkey_cal = get_or_create_silverkey_calendar_func(user_id)
                    resolved_id = silverkey_cal.get("id")
                    if not resolved_id:
                        log.error(
                            "ERRORS", f"SilverKey calendar returned without ID for user {user_id}"
                        )
                        raise ValueError("SilverKey calendar missing ID")
                    log.debug(
                        "CALENDAR",
                        f"Resolved 'primary' to SilverKey calendar {resolved_id} for user {user_id} (restricted scope)",
                    )
                    return resolved_id
                except Exception as e:
                    error_msg = sanitize_error_message(e)
                    log.error(
                        "ERRORS",
                        f"Failed to get/create SilverKey calendar for user {user_id}: {error_msg}",
                    )
                    raise RuntimeError(
                        f"Cannot access primary calendar with restricted scope. Failed to get/create SilverKey calendar: {error_msg}"
                    ) from e
    return calendar_id


def list_calendars(
    user_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list,
    get_or_create_silverkey_calendar_func=None,
) -> list[dict[str, Any]]:
    """List user's Google calendars

    Args:
        user_id: User ID
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        get_or_create_silverkey_calendar_func: Optional function to get/create SilverKey calendar
                                              (used as fallback when restricted scope prevents listing)

    Returns:
        List of calendar dictionaries. With restricted scope (calendar.app.created), returns only
        the SilverKey calendar if available.
    """
    try:
        creds = load_credentials(user_id, client_id, client_secret, token_endpoint, scopes)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        result = service.calendarList().list().execute()
        log_oauth_event("calendars_listed", user_id, count=len(result.get("items", [])))
        return result.get("items", [])
    except HttpError as e:
        if hasattr(e, "resp") and e.resp.status == 403:
            error_msg = str(e).lower()
            is_insufficient_permissions = (
                "insufficientpermissions" in error_msg
                or "insufficient authentication scopes" in error_msg
                or "insufficient permissions" in error_msg
            )
            if is_insufficient_permissions and get_or_create_silverkey_calendar_func:
                log.debug(
                    "CALENDAR",
                    f"User {user_id} has restricted scope (cannot list calendars), returning SilverKey calendar only",
                )
                log_oauth_event(
                    "calendars_list_restricted_scope", user_id, reason="insufficientPermissions"
                )
                try:
                    silverkey_calendar = get_or_create_silverkey_calendar_func(user_id, None)
                    if silverkey_calendar:
                        log_oauth_event("calendars_listed_restricted", user_id, count=1)
                        return [silverkey_calendar]
                    else:
                        log_oauth_event("calendars_list_no_silverkey", user_id)
                        return []
                except Exception as silverkey_error:
                    error_msg = sanitize_error_message(silverkey_error)
                    log.warn(
                        "CALENDAR",
                        f"Failed to get/create SilverKey calendar for user {user_id} with restricted scope: {error_msg}",
                    )
                    log_oauth_event("calendars_list_silverkey_error", user_id, error=error_msg)
                    return []
            else:
                error_msg = sanitize_error_message(e)
                log_oauth_event("calendars_list_error", user_id, error=error_msg)
                log.error("ERRORS", f"Error listing calendars for user {user_id}: {error_msg}")
                raise
        else:
            error_msg = sanitize_error_message(e)
            log_oauth_event("calendars_list_error", user_id, error=error_msg)
            log.error("ERRORS", f"Error listing calendars for user {user_id}: {error_msg}")
            raise
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("calendars_list_error", user_id, error=error_msg)
        log.error("ERRORS", f"Error listing calendars for user {user_id}: {error_msg}")
        raise
