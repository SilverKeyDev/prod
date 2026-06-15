"""
Calendar service helpers
Provides authentication, error handling, and event utilities for Google Calendar routes

This module re-exports public APIs from organized subfolders for backward compatibility.
"""

# Core infrastructure
# Availability
from .availability import (
    query_freebusy,
)

# Calendars
from .calendars import (
    add_calendar_acl,
    create_calendar,
    get_or_create_silverkey_calendar,
    list_calendars,
    resolve_calendar_id,
    setup_agent_client_calendar_sharing,
    share_calendar_with_users,
)
from .core import (
    GoogleCalendarService,
    extract_http_error_details,
    get_authenticated_user,
    get_authenticated_user_id,
    google_calendar_service,
    handle_google_api_error,
    load_credentials,
    with_error_handling,
)

# Events
from .events import (
    create_event,
    delete_event,
    extract_calendar_id_from_request,
    extract_event_datetimes,
    list_events,
    parse_google_datetime,
    update_event,
    validate_max_results,
)

# OAuth
from .oauth import (
    ALL_SCOPE_URLS,
    AUTH_SCOPES,
    CALENDAR_SCOPES,
    DEFAULT_CALENDAR_SCOPES,
    SCHEDULING_SCOPES,
    SCOPE_BY_NAME,
    SCOPE_BY_URL,
    GoogleScope,
    build_auth_url,
    exchange_code_for_tokens,
    generate_state,
    get_scope_by_name,
    get_scope_by_url,
    get_scope_urls_by_category,
    normalize_scope_url,
    validate_state,
    validate_state_and_get_user_id,
)

# Permissions
from .permissions import (
    PERMISSION_DESCRIPTIONS,
    PERMISSION_SCOPE_MAP,
    PERMISSIONS,
    check_multiple_permissions,
    check_permission,
    get_missing_permissions,
    get_permission_scope_map,
    parse_scopes_to_permissions,
    permissions,
    require_permission,
    update_token_permissions_from_scopes,
)

__all__ = [
    # Core
    "GoogleCalendarService",
    "google_calendar_service",
    "load_credentials",
    "handle_google_api_error",
    "with_error_handling",
    "extract_http_error_details",
    "get_authenticated_user",
    "get_authenticated_user_id",
    # OAuth
    "generate_state",
    "validate_state",
    "validate_state_and_get_user_id",
    "build_auth_url",
    "exchange_code_for_tokens",
    "GoogleScope",
    "SCOPE_BY_NAME",
    "SCOPE_BY_URL",
    "ALL_SCOPE_URLS",
    "AUTH_SCOPES",
    "DEFAULT_CALENDAR_SCOPES",
    "SCHEDULING_SCOPES",
    "CALENDAR_SCOPES",
    "get_scope_by_url",
    "get_scope_by_name",
    "get_scope_urls_by_category",
    "normalize_scope_url",
    # Events
    "list_events",
    "create_event",
    "update_event",
    "delete_event",
    "parse_google_datetime",
    "extract_event_datetimes",
    "validate_max_results",
    "extract_calendar_id_from_request",
    # Calendars
    "create_calendar",
    "get_or_create_silverkey_calendar",
    "resolve_calendar_id",
    "list_calendars",
    "add_calendar_acl",
    "setup_agent_client_calendar_sharing",
    "share_calendar_with_users",
    # Permissions
    "permissions",
    "PERMISSIONS",
    "PERMISSION_SCOPE_MAP",
    "PERMISSION_DESCRIPTIONS",
    "parse_scopes_to_permissions",
    "update_token_permissions_from_scopes",
    "check_permission",
    "require_permission",
    "get_missing_permissions",
    "get_permission_scope_map",
    "check_multiple_permissions",
    # Availability
    "query_freebusy",
]
