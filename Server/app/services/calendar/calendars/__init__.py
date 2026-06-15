"""
Calendar management, resolution, and sharing operations
"""

from .management import (
    create_calendar,
    delete_calendar,
    get_or_create_silverkey_calendar,
)
from .resolution import (
    list_calendars,
    resolve_calendar_id,
)
from .sharing import add_calendar_acl
from .sharing_agent_client import setup_agent_client_calendar_sharing
from .sharing_multi_user import share_calendar_with_users

__all__ = [
    "create_calendar",
    "delete_calendar",
    "get_or_create_silverkey_calendar",
    "resolve_calendar_id",
    "list_calendars",
    "add_calendar_acl",
    "setup_agent_client_calendar_sharing",
    "share_calendar_with_users",
]
