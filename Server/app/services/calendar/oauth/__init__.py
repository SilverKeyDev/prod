"""
OAuth flow and scope management for Google Calendar
"""

from .flow import build_auth_url, generate_state, validate_state, validate_state_and_get_user_id
from .scopes import (
    ALL_SCOPE_URLS,
    AUTH_SCOPES,
    CALENDAR_SCOPES,
    DEFAULT_CALENDAR_SCOPES,
    OAUTH_REQUESTED_SCOPE_URLS,
    SCHEDULING_SCOPES,
    SCOPE_BY_NAME,
    SCOPE_BY_URL,
    GoogleScope,
    get_scope_by_name,
    get_scope_by_url,
    get_scope_urls_by_category,
    normalize_scope_url,
)
from .token_exchange import exchange_code_for_tokens

__all__ = [
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
    "OAUTH_REQUESTED_SCOPE_URLS",
    "get_scope_by_url",
    "get_scope_by_name",
    "get_scope_urls_by_category",
    "normalize_scope_url",
]
