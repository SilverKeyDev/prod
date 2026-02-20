"""Agent route handlers."""

from .chats import (
    create_chat,
    get_chat_history,
    get_chats,
    mark_chat_as_read,
    send_message,
    update_event_request_status_route,
)
from .clients import get_clients
from .connection_requests import (
    create_connection_request_endpoint,
    get_connection_requests_endpoint,
    respond_to_connection_request_endpoint,
)
from .notifications import get_notification_counter_endpoint
from .search import search_agents_endpoint, search_clients_endpoint
from .todos import (
    create_todo_endpoint,
    delete_todo_endpoint,
    get_todos,
    update_todo_endpoint,
)

__all__ = [
    "get_clients",
    "get_chats",
    "create_chat",
    "get_chat_history",
    "send_message",
    "update_event_request_status_route",
    "mark_chat_as_read",
    "get_connection_requests_endpoint",
    "create_connection_request_endpoint",
    "respond_to_connection_request_endpoint",
    "search_agents_endpoint",
    "search_clients_endpoint",
    "get_todos",
    "create_todo_endpoint",
    "update_todo_endpoint",
    "delete_todo_endpoint",
    "get_notification_counter_endpoint",
]
