"""
Agent API blueprint. Route handlers live in handlers/.
"""

from flask import Blueprint

from .handlers import (
    create_chat,
    create_connection_request_endpoint,
    create_todo_endpoint,
    delete_todo_endpoint,
    get_chat_history,
    get_chats,
    get_clients,
    get_connection_requests_endpoint,
    get_notification_counter_endpoint,
    get_todos,
    mark_chat_as_read,
    respond_to_connection_request_endpoint,
    recommended_agents_endpoint,
    search_agents_endpoint,
    search_clients_endpoint,
    send_message,
    update_event_request_status_route,
    update_todo_endpoint,
)

agent_bp = Blueprint("agent", __name__, url_prefix="/api/v1/agent")

# Clients
agent_bp.route("/clients", methods=["GET"])(get_clients)

# Chats
agent_bp.route("/chats", methods=["GET"])(get_chats)
agent_bp.route("/chats", methods=["POST"])(create_chat)
agent_bp.route("/chats/<conversation_id>/history", methods=["GET"])(get_chat_history)
agent_bp.route("/chats/message", methods=["POST"])(send_message)
agent_bp.route("/chats/messages/<message_id>/event-request-status", methods=["PATCH"])(
    update_event_request_status_route
)
agent_bp.route("/chats/<conversation_id>/read", methods=["POST"])(mark_chat_as_read)

# Search
agent_bp.route("/search-agents", methods=["GET"])(search_agents_endpoint)
agent_bp.route("/recommended-agents", methods=["GET"])(recommended_agents_endpoint)
agent_bp.route("/search-clients", methods=["GET"])(search_clients_endpoint)

# Connection requests
agent_bp.route("/connection-requests", methods=["GET"])(get_connection_requests_endpoint)
agent_bp.route("/connection-requests", methods=["POST"])(create_connection_request_endpoint)
agent_bp.route("/connection-requests/<request_id>/respond", methods=["POST"])(
    respond_to_connection_request_endpoint
)

# Notifications
agent_bp.route("/notification-counter", methods=["GET"])(get_notification_counter_endpoint)

# Todos
agent_bp.route("/todos", methods=["GET"])(get_todos)
agent_bp.route("/todos", methods=["POST"])(create_todo_endpoint)
agent_bp.route("/todos/<todo_id>", methods=["PUT"])(update_todo_endpoint)
agent_bp.route("/todos/<todo_id>", methods=["DELETE"])(delete_todo_endpoint)
