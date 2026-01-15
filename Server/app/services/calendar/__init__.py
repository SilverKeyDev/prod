"""
Calendar service helpers
Provides authentication, error handling, and event utilities for Google Calendar routes

This module re-exports public APIs from organized subfolders for backward compatibility.
"""

# Core infrastructure
from .core import (
    GoogleCalendarService,
    google_calendar_service,
    load_credentials,
    handle_google_api_error,
    with_error_handling,
    extract_http_error_details,
    get_authenticated_user,
    get_authenticated_user_id,
)

# OAuth
from .oauth import (
    generate_state,
    validate_state,
    build_auth_url,
    exchange_code_for_tokens,
    GoogleScope,
    SCOPE_BY_NAME,
    SCOPE_BY_URL,
    ALL_SCOPE_URLS,
    AUTH_SCOPES,
    DEFAULT_CALENDAR_SCOPES,
    SCHEDULING_SCOPES,
    CALENDAR_SCOPES,
    get_scope_by_url,
    get_scope_by_name,
    get_scope_urls_by_category,
    normalize_scope_url,
)

# Events
from .events import (
    list_events,
    create_event,
    update_event,
    delete_event,
    parse_google_datetime,
    extract_event_datetimes,
    validate_max_results,
    extract_calendar_id_from_request,
)

# Calendars
from .calendars import (
    create_calendar,
    get_or_create_silverkey_calendar,
    resolve_calendar_id,
    list_calendars,
    add_calendar_acl,
    setup_agent_client_calendar_sharing,
    share_calendar_with_users,
)

# Permissions
from .permissions import (
    permissions,
    PERMISSIONS,
    PERMISSION_SCOPE_MAP,
    PERMISSION_DESCRIPTIONS,
    parse_scopes_to_permissions,
    update_token_permissions_from_scopes,
    check_permission,
    require_permission,
    get_missing_permissions,
    get_permission_scope_map,
    check_multiple_permissions,
)

# Availability
from .availability import (
    query_freebusy,
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
