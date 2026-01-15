"""
OAuth flow and scope management for Google Calendar
"""

from .flow import (
    generate_state,
    validate_state,
    build_auth_url,
    exchange_code_for_tokens,
)
from .scopes import (
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

__all__ = [
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
]
