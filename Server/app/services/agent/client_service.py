"""
Service functions for managing agent clients
"""

import json
import logging

from ...models import AgentConnections, User

logger = logging.getLogger(__name__)


def _parse_id_list(raw: str | list | None) -> list[str]:
    """Parse a JSON-or-CSV id list stored as text into a Python list of strings."""
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(x) for x in raw if x]
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(x) for x in parsed if x]
        return [str(parsed)] if parsed else []
    except (json.JSONDecodeError, TypeError):
        return [cid.strip() for cid in raw.split(",") if cid.strip()]


def get_agent_clients(agent_id: str) -> list[dict]:
    """
    Get all clients for a specific agent.

    Primary source: agent.client_ids on the User record.
    Fallback: any AgentConnections rows for this agent (handles data drift).
    If fallback finds clients missing from client_ids, it syncs them.

    Returns:
        List of client dictionaries with id, name, email, phone, profile_picture, created_at
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.warning(f"Agent {agent_id} not found or not an agent")
            return []

        client_id_list = _parse_id_list(agent.client_ids)

        # Fallback: check AgentConnections for clients not in client_ids
        connections = AgentConnections.query.filter_by(agent_id=agent_id).all()
        connected_client_ids = {conn.client_id for conn in connections}
        missing = connected_client_ids - set(client_id_list)

        if missing:
            logger.info(
                f"Agent {agent_id}: syncing {len(missing)} client(s) from AgentConnections into client_ids"
            )
            client_id_list.extend(missing)
            agent.client_ids = json.dumps(client_id_list)
            try:
                from app import db

                db.session.commit()
            except Exception:
                logger.warning("Could not auto-sync client_ids; will return merged list anyway")

        if not client_id_list:
            return []

        clients = User.query.filter(User.id.in_(client_id_list)).all()  # type: ignore[reportAttributeAccessIssue]

        client_list = []
        for client in clients:
            client_data = {
                "id": client.id,
                "name": client.name,
                "email": client.email,
                "phone": client.phone,
                "profile_picture": client.profile_picture,
                "created_at": client.created_at.isoformat() if client.created_at else None,
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
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            return False

        if client_id in _parse_id_list(agent.client_ids):
            return True

        # Fallback: check if an AgentConnections row exists
        return (
            AgentConnections.query.filter_by(agent_id=agent_id, client_id=client_id).first()
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

        agent_ids = _parse_id_list(client.agent_id)
        if agent_ids:
            return agent_ids[0]

        # Fallback: check AgentConnections
        conn = AgentConnections.query.filter_by(client_id=user_id).first()
        return conn.agent_id if conn else None

    except Exception as e:
        logger.error(f"Error getting agent ID for user {user_id}: {e}", exc_info=True)
        return None


def get_agent_client_ids(agent_id: str) -> list[str]:
    """
    Get all client IDs for an agent.

    Merges client_ids from User record with AgentConnections.
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            return []

        ids_from_user = set(_parse_id_list(agent.client_ids))
        connections = AgentConnections.query.filter_by(agent_id=agent_id).all()
        ids_from_conns = {conn.client_id for conn in connections}

        return list(ids_from_user | ids_from_conns)

    except Exception as e:
        logger.error(f"Error getting client IDs for agent {agent_id}: {e}", exc_info=True)
        return []
