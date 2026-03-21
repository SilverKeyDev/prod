"""
Service functions for managing agent clients
"""

import json
import logging

from ...models import User

logger = logging.getLogger(__name__)


def get_agent_clients(agent_id: str) -> list[dict]:
    """
    Get all clients for a specific agent

    Args:
        agent_id: The ID of the agent

    Returns:
        List of client dictionaries with id, name, email, phone, profile_picture, created_at
    """
    try:
        # Parse client_ids from agent's user record
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.warning(f"Agent {agent_id} not found or not an agent")
            return []

        if not agent.client_ids:
            return []

        # Parse client_ids (stored as JSON string or comma-separated string)
        try:
            if isinstance(agent.client_ids, str):
                # Try JSON first
                try:
                    client_id_list = json.loads(agent.client_ids)
                except json.JSONDecodeError:
                    # Fall back to comma-separated
                    client_id_list = [
                        cid.strip() for cid in agent.client_ids.split(",") if cid.strip()
                    ]
            else:
                client_id_list = agent.client_ids if isinstance(agent.client_ids, list) else []
        except Exception as e:
            logger.error(f"Error parsing client_ids for agent {agent_id}: {e}")
            return []

        if not client_id_list:
            return []

        # Fetch client users (User.id is SQLAlchemy column with .in_())
        clients = User.query.filter(User.id.in_(client_id_list)).all()  # type: ignore[reportAttributeAccessIssue]

        # Format response
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
    Validate that an agent-client relationship exists

    Args:
        agent_id: The ID of the agent
        client_id: The ID of the client

    Returns:
        True if relationship exists, False otherwise
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            return False

        if not agent.client_ids:
            return False

        # Parse client_ids (stored as JSON string or comma-separated string)
        try:
            if isinstance(agent.client_ids, str):
                try:
                    client_id_list = json.loads(agent.client_ids)
                except json.JSONDecodeError:
                    client_id_list = [
                        cid.strip() for cid in agent.client_ids.split(",") if cid.strip()
                    ]
            else:
                client_id_list = agent.client_ids if isinstance(agent.client_ids, list) else []
        except Exception as e:
            logger.error(f"Error parsing client_ids for agent {agent_id}: {e}")
            return False

        return client_id in client_id_list

    except Exception as e:
        logger.error(f"Error validating agent-client relationship: {e}", exc_info=True)
        return False


def get_user_agent_id(user_id: str) -> str | None:
    """
    Get the primary agent ID for a client user

    Args:
        user_id: The ID of the client user

    Returns:
        Agent ID if found, None otherwise
    """
    try:
        client = User.query.filter_by(id=user_id, is_agent=False).first()
        if not client or not client.agent_id:
            return None

        # Parse agent_id (stored as JSON string or comma-separated string)
        try:
            if isinstance(client.agent_id, str):
                try:
                    agent_id_list = json.loads(client.agent_id)
                except json.JSONDecodeError:
                    agent_id_list = [
                        aid.strip() for aid in client.agent_id.split(",") if aid.strip()
                    ]
            else:
                agent_id_list = client.agent_id if isinstance(client.agent_id, list) else []
        except Exception as e:
            logger.error(f"Error parsing agent_id for client {user_id}: {e}")
            return None

        # Return first agent ID (primary agent)
        return agent_id_list[0] if agent_id_list else None

    except Exception as e:
        logger.error(f"Error getting agent ID for user {user_id}: {e}", exc_info=True)
        return None


def get_agent_client_ids(agent_id: str) -> list[str]:
    """
    Get all client IDs for an agent

    Args:
        agent_id: The ID of the agent

    Returns:
        List of client IDs
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent or not agent.client_ids:
            return []

        # Parse client_ids (stored as JSON string or comma-separated string)
        try:
            if isinstance(agent.client_ids, str):
                try:
                    client_id_list = json.loads(agent.client_ids)
                except json.JSONDecodeError:
                    client_id_list = [
                        cid.strip() for cid in agent.client_ids.split(",") if cid.strip()
                    ]
            else:
                client_id_list = agent.client_ids if isinstance(agent.client_ids, list) else []
        except Exception as e:
            logger.error(f"Error parsing client_ids for agent {agent_id}: {e}")
            return []

        return client_id_list if isinstance(client_id_list, list) else []

    except Exception as e:
        logger.error(f"Error getting client IDs for agent {agent_id}: {e}", exc_info=True)
        return []
