"""
Event CRUD route handlers for Google Calendar.

Re-exported for blueprint registration and test patching.
"""

from .create_event import create_event
from .delete_event import delete_event
from .get_event import fetch_single_calendar_event
from .list_client_events import list_client_events
from .list_events import list_events
from .update_event import update_event

__all__ = [
    "create_event",
    "delete_event",
    "fetch_single_calendar_event",
    "list_client_events",
    "list_events",
    "update_event",
]
