"""
Agent service module for managing agent-client relationships and conversations
"""

from .client_service import get_agent_clients, get_client_info
from .conversation_service import (
    get_conversations,
    get_conversation,
    create_conversation,
    get_conversation_history,
    send_message,
    get_unread_count,
    mark_messages_as_read,
    get_notification_counter,
)
from .connection_request_service import (
    search_agents,
    search_clients,
    get_connection_requests,
    create_connection_request,
    respond_to_connection_request,
)
from .todo_service import (
    get_agent_todos,
    create_todo,
    update_todo,
    delete_todo,
)

__all__ = [
    'get_agent_clients',
    'get_client_info',
    'get_conversations',
    'get_conversation',
    'create_conversation',
    'get_conversation_history',
    'send_message',
    'get_unread_count',
    'mark_messages_as_read',
    'get_notification_counter',
    'search_agents',
    'search_clients',
    'get_connection_requests',
    'create_connection_request',
    'respond_to_connection_request',
    'get_agent_todos',
    'create_todo',
    'update_todo',
    'delete_todo',
]
