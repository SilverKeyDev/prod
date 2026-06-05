"""Shared mocks and helpers for Google Calendar route tests."""

from contextlib import ExitStack, contextmanager
from unittest.mock import Mock, patch

# Consumers bind `load_credentials` / `resolve_calendar_id` at import time; patch use sites.
_CALENDAR_LOAD_CREDENTIALS_TARGETS = (
    "app.services.calendar.events.operations.load_credentials",
    "app.services.calendar.events.operations_list_events.load_credentials",
    "app.services.calendar.calendars.sharing.load_credentials",
    "app.services.calendar.calendars.resolution.load_credentials",
    "app.services.calendar.calendars.calendar_create.load_credentials",
    "app.services.calendar.calendars.calendar_delete.load_credentials",
    "app.services.calendar.availability.freebusy.load_credentials",
)


@contextmanager
def patch_google_calendar_load_credentials():
    mock_creds = Mock()
    with ExitStack() as stack:
        for target in _CALENDAR_LOAD_CREDENTIALS_TARGETS:
            stack.enter_context(patch(target, return_value=mock_creds))
        yield


def auth_user(user_id: str = "user-123", *, has_agent_role: bool = False) -> Mock:
    user = Mock()
    user.id = user_id
    user._test_has_agent_role = has_agent_role
    user.email = "user@example.com"
    return user
