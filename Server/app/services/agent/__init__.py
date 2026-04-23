"""
Agent service module for managing agent-client relationships and conversations
"""

from .client_service import get_agent_clients, get_client_info
from .connection_request_service import (
    create_connection_request,
    get_connection_requests,
    recommend_agents,
    respond_to_connection_request,
    search_agents,
    search_clients,
)
from .conversation_service import (
    create_conversation,
    get_conversation,
    get_conversation_history,
    get_conversations,
    get_notification_counter,
    get_unread_count,
    mark_messages_as_read,
    send_message,
    update_event_request_status,
)
from .todo_service import (
    create_todo,
    delete_todo,
    get_agent_todos,
    get_client_todos,
    resolve_primary_agent_id_for_client,
    update_todo,
)

__all__ = [
    "get_agent_clients",
    "get_client_info",
    "get_conversations",
    "get_conversation",
    "create_conversation",
    "get_conversation_history",
    "send_message",
    "update_event_request_status",
    "get_unread_count",
    "mark_messages_as_read",
    "get_notification_counter",
    "recommend_agents",
    "search_agents",
    "search_clients",
    "get_connection_requests",
    "create_connection_request",
    "respond_to_connection_request",
    "get_agent_todos",
    "get_client_todos",
    "resolve_primary_agent_id_for_client",
    "create_todo",
    "update_todo",
    "delete_todo",
]
