"""Authorization helpers for agent–client conversations (shared by routes and services)."""

from __future__ import annotations

from typing import Any

from .client_service import (
    get_connected_agent_ids_for_client,
    validate_agent_client_relationship,
)


def user_may_access_conversation(conversation: dict[str, Any] | None, user_id: str) -> bool:
    """True if user_id is the agent or client on this conversation."""
    if not conversation or not user_id:
        return False
    uid = str(user_id)
    return str(conversation.get("agent_id")) == uid or str(conversation.get("client_id")) == uid


def established_messaging_relationship(agent_id: str, client_id: str) -> bool:
    """
    True when there is an existing agent↔client link before creating a new AgentConnections row.

    Uses agent-side roster / existing conversation rows, plus client's linked agents (agent_id JSON
    and AgentConnections) so first-time client messaging matches assigned agent.
    """
    if not agent_id or not client_id:
        return False
    if validate_agent_client_relationship(agent_id, client_id):
        return True
    return str(agent_id) in {str(a) for a in get_connected_agent_ids_for_client(client_id)}
