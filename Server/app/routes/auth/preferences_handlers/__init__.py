"""Preferences route handlers."""

from .action_plan import generate_client_action_plan
from .agents import get_agents, get_user_agents, remove_agent_relationship, set_as_agent
from .preferences import (
    create_or_update_preferences,
    get_clients_preferences,
    get_preferences,
    get_user_preferences_by_id,
)

__all__ = [
    "create_or_update_preferences",
    "get_preferences",
    "get_user_preferences_by_id",
    "get_clients_preferences",
    "get_agents",
    "set_as_agent",
    "get_user_agents",
    "remove_agent_relationship",
    "generate_client_action_plan",
]
