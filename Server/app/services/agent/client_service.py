"""
Service functions for managing agent clients
"""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.services.agent.enrichment.client_list_enrichment import (
    batch_client_kinds,
    batch_current_step,
    batch_pipeline_stages,
    batch_profile_picture_urls,
    batch_requires_signature,
)
from app.services.auth.user_role_helpers import get_user_if_agent
from app.services.transactions.ensure import ensure_transaction
from logger import log

from ...models import AgentConnections, Transaction, User


def get_agent_clients(agent_id: str) -> list[dict]:
    """
    Get all clients for a specific agent from ``agent_conversations``.

    Returns:
        List of client dictionaries including client_kind and pipeline_stage (see OpenAPI AgentClient).
    """
    try:
        agent = get_user_if_agent(agent_id)
        if not agent:
            log.warn("API", f"Agent {agent_id} not found or not an agent")
            return []
        connections = db.session.scalars(
            select(AgentConnections).where(AgentConnections.agent_id == agent_id)
        ).all()
        client_id_list = [conn.client_id for conn in connections if conn.client_id]
        if not client_id_list:
            return []
        clients = db.session.scalars(select(User).where(User.id.in_(client_id_list))).all()
        by_id = {c.id: c for c in clients}
        ordered_clients = [by_id[cid] for cid in client_id_list if cid in by_id]
        ordered_ids = [c.id for c in ordered_clients]
        tx_by_buyer = {
            str(row.buyer_id): str(row.id)
            for row in db.session.scalars(
                select(Transaction).where(Transaction.buyer_id.in_(ordered_ids))
            ).all()
        }
        kind_by_id = batch_client_kinds(ordered_ids)
        stage_by_id = batch_pipeline_stages(ordered_ids)
        step_by_id = batch_current_step(ordered_ids)
        avatar_url_by_id = batch_profile_picture_urls(ordered_clients)
        signature_by_id = batch_requires_signature(agent_id, ordered_ids)
        client_list = []
        for client in ordered_clients:
            cid = client.id
            tx_id = tx_by_buyer.get(cid)
            if not tx_id:
                tx_id = ensure_transaction(buyer_id=cid, primary_agent_id=agent_id).id
                tx_by_buyer[cid] = tx_id
            current_phase, current_step_label = step_by_id.get(cid, ("search", None))
            client_data = {
                "id": cid,
                "transaction_id": tx_id,
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
        log.error("ERRORS", f"Error fetching clients for agent {agent_id}: {e}", e)
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
        client = db.session.scalar(select(User).where(User.id == client_id))
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
        log.error("ERRORS", f"Error fetching client info for {client_id}: {e}", e)
        raise


def validate_agent_client_relationship(agent_id: str, client_id: str) -> bool:
    """Validate that an agent-client relationship exists via ``agent_conversations``."""
    return agent_may_access_client(agent_id, client_id)


def agent_may_access_client(agent_id: str, client_id: str) -> bool:
    """True when *client_id* is linked to *agent_id* in ``agent_conversations``."""
    try:
        agent_id_s = str(agent_id).strip()
        client_id_s = str(client_id).strip()
        if not agent_id_s or not client_id_s:
            return False
        if get_user_if_agent(agent_id_s) is None:
            return False
        return (
            db.session.scalar(
                select(AgentConnections).where(
                    AgentConnections.agent_id == agent_id_s,
                    AgentConnections.client_id == client_id_s,
                )
            )
            is not None
        )
    except Exception as e:
        log.error("ERRORS", f"Error validating agent-client relationship: {e}", e)
        return False


def get_user_agent_id(user_id: str) -> str | None:
    """Get the primary agent ID for a client user from ``agent_conversations``."""
    try:
        conn = db.session.scalar(
            select(AgentConnections).where(AgentConnections.client_id == user_id)
        )
        return conn.agent_id if conn else None
    except Exception as e:
        log.error("ERRORS", f"Error getting agent ID for user {user_id}: {e}", e)
        return None


def get_connected_agent_ids_for_client(client_id: str) -> set[str]:
    """All agent user IDs linked to this client via ``agent_conversations``."""
    try:
        connections = db.session.scalars(
            select(AgentConnections).where(AgentConnections.client_id == client_id)
        ).all()
        return {conn.agent_id for conn in connections if conn.agent_id}
    except Exception as e:
        log.error("ERRORS", f"Error resolving connected agents for client {client_id}: {e}", e)
        raise


def get_agent_client_ids(agent_id: str) -> list[str]:
    """Get all client IDs for an agent from ``agent_conversations``."""
    try:
        if get_user_if_agent(agent_id) is None:
            return []
        connections = db.session.scalars(
            select(AgentConnections).where(AgentConnections.agent_id == agent_id)
        ).all()
        return [conn.client_id for conn in connections if conn.client_id]
    except Exception as e:
        log.error("ERRORS", f"Error getting client IDs for agent {agent_id}: {e}", e)
        return []
