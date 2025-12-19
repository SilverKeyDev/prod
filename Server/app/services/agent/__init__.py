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
)
from .connection_request_service import (
    search_agents,
    search_clients,
    get_connection_requests,
    create_connection_request,
    respond_to_connection_request,
)

__all__ = [
    'get_agent_clients',
    'get_client_info',
    'get_conversations',
    'get_conversation',
    'create_conversation',
    'get_conversation_history',
    'send_message',
    'search_agents',
    'search_clients',
    'get_connection_requests',
    'create_connection_request',
    'respond_to_connection_request',
]
