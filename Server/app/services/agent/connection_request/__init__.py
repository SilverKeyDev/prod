"""Agent connection request discovery, helpers, and service."""

from .discovery import recommend_agents, search_agents, search_clients
from .service import (
    create_connection_request,
    get_connection_requests,
    respond_to_connection_request,
)

__all__ = [
    "create_connection_request",
    "get_connection_requests",
    "recommend_agents",
    "respond_to_connection_request",
    "search_agents",
    "search_clients",
]
