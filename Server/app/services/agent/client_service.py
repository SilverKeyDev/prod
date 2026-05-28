"""
Service functions for managing agent clients
"""

from __future__ import annotations

import logging

from app import db
from app.services.agent.enrichment.client_list_enrichment import (
    batch_client_kinds,
    batch_current_step,
    batch_pipeline_stages,
    batch_profile_picture_urls,
    batch_requires_signature,
)

from ...models import AgentConnections, User
from ...utils.format.json_string_list_parse import (
    parse_json_or_csv_string_list,
    serialize_json_string_list,
)

logger = logging.getLogger(__name__)


def append_unique_client_id(agent: User, client_id: str) -> None:
    """Mutate agent.client_ids to include client_id once."""
    merged = parse_json_or_csv_string_list(agent.client_ids)
    if client_id not in merged:
        merged.append(client_id)
        agent.client_ids = serialize_json_string_list(merged)


def append_unique_agent_id_for_client(client: User, agent_id: str) -> None:
    """Mutate client.agent_id JSON list to include agent_id once."""
    merged = parse_json_or_csv_string_list(client.agent_id)
    if agent_id not in merged:
        merged.append(agent_id)
        client.agent_id = serialize_json_string_list(merged)


def get_agent_clients(agent_id: str) -> list[dict]:
    """
    Get all clients for a specific agent.

    Primary source: agent.client_ids on the User record.
    Fallback: any AgentConnections rows for this agent (handles data drift).
    If fallback finds clients missing from client_ids, it syncs them.

    Returns:
        List of client dictionaries including client_kind and pipeline_stage (see OpenAPI AgentClient).
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.warning(f"Agent {agent_id} not found or not an agent")
            return []

        client_id_list = parse_json_or_csv_string_list(agent.client_ids)

        # Fallback: check AgentConnections for clients not in client_ids
        connections = AgentConnections.query.filter_by(agent_id=agent_id).all()
        connected_client_ids = {conn.client_id for conn in connections}
        missing = connected_client_ids - set(client_id_list)

        if missing:
            logger.info(
                f"Agent {agent_id}: syncing {len(missing)} client(s) from AgentConnections into client_ids"
            )
            client_id_list.extend(missing)
            agent.client_ids = serialize_json_string_list(client_id_list)
            try:
                db.session.commit()
            except Exception:
                logger.warning("Could not auto-sync client_ids; will return merged list anyway")

        if not client_id_list:
            return []

        clients = User.query.filter(User.id.in_(client_id_list)).all()  # type: ignore[reportAttributeAccessIssue]
        by_id = {c.id: c for c in clients}
        ordered_clients = [by_id[cid] for cid in client_id_list if cid in by_id]

        ordered_ids = [c.id for c in ordered_clients]
        kind_by_id = batch_client_kinds(ordered_ids)
        stage_by_id = batch_pipeline_stages(ordered_ids)
        step_by_id = batch_current_step(ordered_ids)
        avatar_url_by_id = batch_profile_picture_urls(ordered_clients)
        signature_by_id = batch_requires_signature(agent_id, ordered_ids)

        client_list = []
        for client in ordered_clients:
            cid = client.id
            current_phase, current_step_label = step_by_id.get(cid, ("search", None))
            client_data = {
                "id": cid,
                "name": client.name,
                "email": client.email,
                "phone": client.phone,
                "profile_picture": client.profile_picture,
                "profile_picture_url": avatar_url_by_id.get(cid),
                "created_at": client.created_at.isoformat() if client.created_at else None,
                "client_kind": kind_by_id.get(cid, "unknown"),
                "pipeline_stage": stage_by_id.get(cid, "search"),
                "current_phase": current_phase,
                "current_step_label": current_step_label,
                "requires_signature": signature_by_id.get(cid, False),
            }
            client_list.append(client_data)

        return client_list

    except Exception as e:
        logger.error(f"Error fetching clients for agent {agent_id}: {e}", exc_info=True)
        raise


def get_client_info(client_id: str) -> dict | None:
    """
    Get detailed information about a specific client

    Args:
        client_id: The ID of the client

    Returns:
        Client dictionary with details or None if not found
    """
    try:
        client = User.query.filter_by(id=client_id).first()
        if not client:
            return None

        return {
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "is_active": client.is_active,
        }

    except Exception as e:
        logger.error(f"Error fetching client info for {client_id}: {e}", exc_info=True)
        raise


def validate_agent_client_relationship(agent_id: str, client_id: str) -> bool:
    """
    Validate that an agent-client relationship exists.

    Checks client_ids first, then falls back to AgentConnections.
    """
    return agent_may_access_client(agent_id, client_id)


def agent_may_access_client(agent_id: str, client_id: str) -> bool:
    """
    True when *client_id* is on the agent roster (User.client_ids) or linked via AgentConnections.
    """
    try:
        agent_id_s = str(agent_id).strip()
        client_id_s = str(client_id).strip()
        if not agent_id_s or not client_id_s:
            return False

        agent = User.query.filter_by(id=agent_id_s, is_agent=True).first()
        if not agent:
            return False

        roster = {str(x) for x in parse_json_or_csv_string_list(agent.client_ids)}
        if client_id_s in roster:
            return True

        return (
            AgentConnections.query.filter_by(agent_id=agent_id_s, client_id=client_id_s).first()
            is not None
        )

    except Exception as e:
        logger.error(f"Error validating agent-client relationship: {e}", exc_info=True)
        return False


def get_user_agent_id(user_id: str) -> str | None:
    """
    Get the primary agent ID for a client user.

    Checks client.agent_id first, then falls back to AgentConnections.
    """
    try:
        client = User.query.filter_by(id=user_id, is_agent=False).first()
        if not client:
            return None

        agent_ids = parse_json_or_csv_string_list(client.agent_id)
        if agent_ids:
            return agent_ids[0]

        # Fallback: check AgentConnections
        conn = AgentConnections.query.filter_by(client_id=user_id).first()
        return conn.agent_id if conn else None

    except Exception as e:
        logger.error(f"Error getting agent ID for user {user_id}: {e}", exc_info=True)
        return None


def get_connected_agent_ids_for_client(client_id: str) -> set[str]:
    """
    All agent user IDs linked to this client (accepted connections).

    Merges `users.agent_id` (JSON or CSV list) with `AgentConnections` rows.
    """
    try:
        client = User.query.filter_by(id=client_id, is_agent=False).first()
        if not client:
            return set()

        ids = set(parse_json_or_csv_string_list(client.agent_id))
        connections = AgentConnections.query.filter_by(client_id=client_id).all()
        ids |= {conn.agent_id for conn in connections if conn.agent_id}
        return ids

    except Exception as e:
        logger.error(f"Error resolving connected agents for client {client_id}: {e}", exc_info=True)
        raise


def get_agent_client_ids(agent_id: str) -> list[str]:
    """
    Get all client IDs for an agent.

    Merges client_ids from User record with AgentConnections.
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            return []

        ids_from_user = set(parse_json_or_csv_string_list(agent.client_ids))
        connections = AgentConnections.query.filter_by(agent_id=agent_id).all()
        ids_from_conns = {conn.client_id for conn in connections}

        return list(ids_from_user | ids_from_conns)

    except Exception as e:
        logger.error(f"Error getting client IDs for agent {agent_id}: {e}", exc_info=True)
        return []
