"""
Google OAuth Scope Configuration
Centralized definitions for all Google OAuth scopes used in the application.

This module provides:
- Scope URL constants
- Scope descriptions
- Documentation links
- Helper functions for scope management

NOTE: All scope URLs are sourced from app.services.calendar.permissions.constants
to ensure only approved permissions are used.
"""

from dataclasses import dataclass

# Import permissions constants as the single source of truth
from app.services.calendar.permissions.constants import permissions


@dataclass
class GoogleScope:
    """Represents a Google OAuth scope with metadata"""

    url: str
    name: str
    description: str
    documentation_url: str
    requires_verification: bool = False
    category: str = "general"  # 'auth', 'calendar', etc.


# Authentication Scopes - sourced from permissions constants
SCOPE_USERINFO_EMAIL = GoogleScope(
    url=permissions["userinfo_email"]["scope_url"],
    name="userinfo_email",
    description=permissions["userinfo_email"]["description"],
    documentation_url="https://developers.google.com/identity/protocols/oauth2/scopes#oauth2",
    requires_verification=False,
    category="auth",
)

SCOPE_USERINFO_PROFILE = GoogleScope(
    url=permissions["userinfo_profile"]["scope_url"],
    name="userinfo_profile",
    description=permissions["userinfo_profile"]["description"],
    documentation_url="https://developers.google.com/identity/protocols/oauth2/scopes#oauth2",
    requires_verification=False,
    category="auth",
)

SCOPE_OPENID = GoogleScope(
    url=permissions["openid"]["scope_url"],
    name="openid",
    description=permissions["openid"]["description"],
    documentation_url="https://developers.google.com/identity/protocols/oauth2/openid-connect",
    requires_verification=False,
    category="auth",
)

# Calendar Scopes - sourced from permissions constants
SCOPE_CALENDAR_APP_CREATED = GoogleScope(
    url=permissions["calendar_app_created"]["scope_url"],
    name="calendar_app_created",
    description=permissions["calendar_app_created"]["description"],
    documentation_url="https://developers.google.com/calendar/api/guides/auth#calendar.app.created",
    requires_verification=False,  # Non-sensitive, no OAuth verification required
    category="calendar",
)

SCOPE_CALENDAR_FREEBUSY = GoogleScope(
    url=permissions["calendar_freebusy"]["scope_url"],
    name="calendar_freebusy",
    description=permissions["calendar_freebusy"]["description"],
    documentation_url="https://developers.google.com/calendar/api/guides/auth#calendar.freebusy",
    requires_verification=True,  # Sensitive scope, requires OAuth verification
    category="calendar",
)

SCOPE_CALENDAR_CALENDARLIST_READONLY = GoogleScope(
    url=permissions["calendar_calendarlist_readonly"]["scope_url"],
    name="calendar_calendarlist_readonly",
    description=permissions["calendar_calendarlist_readonly"]["description"],
    documentation_url="https://developers.google.com/calendar/api/guides/auth#calendar.calendarlist.readonly",
    requires_verification=False,
    category="calendar",
)

SCOPE_CALENDAR_EVENTS_FREEBUSY = GoogleScope(
    url=permissions["calendar_events_freebusy"]["scope_url"],
    name="calendar_events_freebusy",
    description=permissions["calendar_events_freebusy"]["description"],
    documentation_url="https://developers.google.com/calendar/api/guides/auth#calendar.events.freebusy",
    requires_verification=False,
    category="calendar",
)

SCOPE_CALENDAR = GoogleScope(
    url=permissions["calendar"]["scope_url"],
    name="calendar",
    description=permissions["calendar"]["description"],
    documentation_url="https://developers.google.com/calendar/api/guides/auth#calendar",
    requires_verification=True,
    category="calendar",
)

# Dictionary mapping scope names to scope objects
SCOPE_BY_NAME: dict[str, GoogleScope] = {
    SCOPE_USERINFO_EMAIL.name: SCOPE_USERINFO_EMAIL,
    SCOPE_USERINFO_PROFILE.name: SCOPE_USERINFO_PROFILE,
    SCOPE_OPENID.name: SCOPE_OPENID,
    SCOPE_CALENDAR_APP_CREATED.name: SCOPE_CALENDAR_APP_CREATED,
    SCOPE_CALENDAR_FREEBUSY.name: SCOPE_CALENDAR_FREEBUSY,
    SCOPE_CALENDAR_CALENDARLIST_READONLY.name: SCOPE_CALENDAR_CALENDARLIST_READONLY,
    SCOPE_CALENDAR_EVENTS_FREEBUSY.name: SCOPE_CALENDAR_EVENTS_FREEBUSY,
    SCOPE_CALENDAR.name: SCOPE_CALENDAR,
}

# Dictionary mapping scope URLs to scope objects
SCOPE_BY_URL: dict[str, GoogleScope] = {scope.url: scope for scope in SCOPE_BY_NAME.values()}

# All scope URLs as a list
ALL_SCOPE_URLS: list[str] = [scope.url for scope in SCOPE_BY_NAME.values()]

# Authentication scopes (for sign-in/sign-up)
AUTH_SCOPES: list[str] = [
    SCOPE_USERINFO_EMAIL.url,
    SCOPE_USERINFO_PROFILE.url,
    SCOPE_OPENID.url,
]

# Default calendar scopes (non-sensitive, no verification required)
DEFAULT_CALENDAR_SCOPES: list[str] = [
    SCOPE_CALENDAR_APP_CREATED.url,
]

# Scheduling scopes (includes sensitive scope requiring verification)
SCHEDULING_SCOPES: list[str] = [
    SCOPE_CALENDAR_APP_CREATED.url,
    SCOPE_CALENDAR_FREEBUSY.url,
]

# All calendar scopes
CALENDAR_SCOPES: list[str] = [
    SCOPE_CALENDAR_APP_CREATED.url,
    SCOPE_CALENDAR_FREEBUSY.url,
    SCOPE_CALENDAR_CALENDARLIST_READONLY.url,
    SCOPE_CALENDAR_EVENTS_FREEBUSY.url,
    SCOPE_CALENDAR.url,
]


def get_scope_by_url(scope_url: str) -> GoogleScope | None:
    """Get scope object by URL

    Args:
        scope_url: The scope URL to look up

    Returns:
        GoogleScope object if found, None otherwise
    """
    return SCOPE_BY_URL.get(scope_url)


def get_scope_by_name(scope_name: str) -> GoogleScope | None:
    """Get scope object by name

    Args:
        scope_name: The scope name to look up (e.g., 'calendar_app_created')

    Returns:
        GoogleScope object if found, None otherwise
    """
    return SCOPE_BY_NAME.get(scope_name)


def get_scope_urls_by_category(category: str) -> list[str]:
    """Get all scope URLs for a given category

    Args:
        category: Category name ('auth', 'calendar', etc.)

    Returns:
        List of scope URLs in that category
    """
    return [scope.url for scope in SCOPE_BY_NAME.values() if scope.category == category]


def normalize_scope_url(scope_url: str) -> str | None:
    """Normalize a scope URL (strip whitespace, handle case variations)

    Args:
        scope_url: The scope URL to normalize

    Returns:
        Normalized scope URL if it matches a known scope, None otherwise
    """
    normalized = scope_url.strip()
    # Try exact match first
    if normalized in SCOPE_BY_URL:
        return normalized
    # Try case-insensitive match
    normalized_lower = normalized.lower()
    for url, _scope in SCOPE_BY_URL.items():
        if url.lower() == normalized_lower:
            return url
    return None
