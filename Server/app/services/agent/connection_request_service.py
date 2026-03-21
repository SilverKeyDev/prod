"""
Service functions for managing agent-client connection requests
"""

import json
import logging
from datetime import datetime

from ... import db
from ...models import AgentConnectionRequest, AgentConnections, User

logger = logging.getLogger(__name__)


def search_agents(query: str, limit: int = 20) -> list[dict]:
    """
    Search for agents by name or email

    Args:
        query: Search query string
        limit: Maximum number of results

    Returns:
        List of agent dictionaries
    """
    try:
        if not query or len(query.strip()) < 2:
            return []

        search_term = f"%{query.strip()}%"
        agents = (
            User.query.filter(
                User.is_agent.is_(True),
                db.or_(User.name.ilike(search_term), User.email.ilike(search_term)),
            )
            .limit(limit)
            .all()
        )

        result = []
        for agent in agents:
            result.append(
                {
                    "id": agent.id,
                    "name": agent.name,
                    "email": agent.email,
                    "phone": agent.phone,
                    "created_at": agent.created_at.isoformat() if agent.created_at else None,
                }
            )

        return result

    except Exception as e:
        logger.error(f"Error searching agents: {e}", exc_info=True)
        raise


def search_clients(query: str, agent_id: str, limit: int = 20) -> list[dict]:
    """
    Search for clients by name or email (for agents)

    Args:
        query: Search query string
        agent_id: ID of the agent doing the search
        limit: Maximum number of results

    Returns:
        List of client dictionaries
    """
    try:
        if not query or len(query.strip()) < 2:
            return []

        search_term = f"%{query.strip()}%"
        clients = (
            User.query.filter(
                User.is_agent.is_(False),
                db.or_(User.name.ilike(search_term), User.email.ilike(search_term)),
            )
            .limit(limit)
            .all()
        )

        result = []
        for client in clients:
            result.append(
                {
                    "id": client.id,
                    "name": client.name,
                    "email": client.email,
                    "phone": client.phone,
                    "created_at": client.created_at.isoformat() if client.created_at else None,
                }
            )

        return result

    except Exception as e:
        logger.error(f"Error searching clients: {e}", exc_info=True)
        raise


def get_connection_requests(user_id: str, is_agent: bool) -> list[dict]:
    """
    Get connection requests for a user

    Args:
        user_id: The ID of the user
        is_agent: Whether the user is an agent

    Returns:
        List of connection request dictionaries
    """
    try:
        if is_agent:
            # Incoming only: clients who requested this agent
            requests = AgentConnectionRequest.query.filter_by(
                agent_id=user_id, status="pending", requested_by_agent=False
            ).all()
        else:
            # Incoming only: agents who requested this client
            requests = AgentConnectionRequest.query.filter_by(
                client_id=user_id, status="pending", requested_by_agent=True
            ).all()

        result = []
        for req in requests:
            # Get the other party's info
            if is_agent:
                other_party = User.query.filter_by(id=req.client_id).first()
            else:
                other_party = User.query.filter_by(id=req.agent_id).first()

            result.append(
                {
                    "id": req.id,
                    "agent_id": req.agent_id,
                    "client_id": req.client_id,
                    "requested_by_agent": req.requested_by_agent,
                    "status": req.status,
                    "message": req.message,
                    "other_party_name": other_party.name if other_party else "Unknown",
                    "other_party_email": other_party.email if other_party else "",
                    "created_at": req.created_at.isoformat() if req.created_at else None,
                }
            )

        return result

    except Exception as e:
        logger.error(f"Error fetching connection requests: {e}", exc_info=True)
        raise


def create_connection_request(
    agent_id: str, client_id: str, requested_by_agent: bool, message: str | None = None
) -> dict:
    """
    Create a new connection request

    Args:
        agent_id: The ID of the agent
        client_id: The ID of the client
        requested_by_agent: Whether the agent initiated the request
        message: Optional message with the request

    Returns:
        {"request": connection request dict, "already_pending": bool}
    """
    try:
        # Check if request already exists
        existing = AgentConnectionRequest.query.filter_by(
            agent_id=agent_id, client_id=client_id, status="pending"
        ).first()

        if existing:
            return {"request": existing.to_dict(), "already_pending": True}

        # Verify users exist
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        client = User.query.filter_by(id=client_id, is_agent=False).first()
        if not client:
            raise ValueError(f"Client {client_id} not found")

        # Create request
        request = AgentConnectionRequest(
            agent_id=agent_id,
            client_id=client_id,
            requested_by_agent=requested_by_agent,
            message=message,
            status="pending",
        )

        db.session.add(request)
        db.session.commit()

        return {"request": request.to_dict(), "already_pending": False}

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating connection request: {e}", exc_info=True)
        raise


def respond_to_connection_request(
    request_id: str, user_id: str, is_agent: bool, accept: bool
) -> dict:
    """
    Accept or reject a connection request

    Args:
        request_id: The ID of the connection request
        user_id: The ID of the user responding
        is_agent: Whether the user is an agent
        accept: Whether to accept (True) or reject (False) the request

    Returns:
        Updated connection request dictionary
    """
    try:
        request = AgentConnectionRequest.query.filter_by(id=request_id).first()
        if not request:
            raise ValueError(f"Connection request {request_id} not found")

        # Only the invitee may accept/reject (not the initiator)
        if request.requested_by_agent:
            if is_agent or request.client_id != user_id:
                raise ValueError("Only the invited client can respond to this request")
        else:
            if not is_agent or request.agent_id != user_id:
                raise ValueError("Only the invited agent can respond to this request")

        if request.status != "pending":
            raise ValueError(f"Request already {request.status}")

        request.status = "accepted" if accept else "rejected"
        request.responded_at = datetime.utcnow()
        request.updated_at = datetime.utcnow()

        # If accepted, create a conversation
        if accept:
            # Check if conversation already exists
            existing_conv = AgentConnections.query.filter_by(
                agent_id=request.agent_id, client_id=request.client_id
            ).first()

            if not existing_conv:
                conversation = AgentConnections(
                    agent_id=request.agent_id, client_id=request.client_id
                )
                db.session.add(conversation)

            # Update agent's client_ids and client's agent_id
            agent = User.query.filter_by(id=request.agent_id).first()
            client = User.query.filter_by(id=request.client_id).first()

            if agent and agent.client_ids:
                try:
                    client_ids = (
                        json.loads(agent.client_ids)
                        if isinstance(agent.client_ids, str)
                        else agent.client_ids
                    )
                    if not isinstance(client_ids, list):
                        client_ids = [client_ids] if client_ids else []
                    if request.client_id not in client_ids:
                        client_ids.append(request.client_id)
                        agent.client_ids = json.dumps(client_ids)
                except Exception:
                    # Fall back to comma-separated
                    client_ids = agent.client_ids.split(",") if agent.client_ids else []
                    if request.client_id not in client_ids:
                        client_ids.append(request.client_id)
                        agent.client_ids = ",".join(client_ids)
            elif agent:
                agent.client_ids = json.dumps([request.client_id])

            if client:
                if client.agent_id:
                    try:
                        agent_ids = (
                            json.loads(client.agent_id)
                            if isinstance(client.agent_id, str)
                            else client.agent_id
                        )
                        if not isinstance(agent_ids, list):
                            agent_ids = [agent_ids] if agent_ids else []
                        if request.agent_id not in agent_ids:
                            agent_ids.append(request.agent_id)
                            client.agent_id = json.dumps(agent_ids)
                    except Exception:
                        # Fall back to comma-separated
                        agent_ids = client.agent_id.split(",") if client.agent_id else []
                        if request.agent_id not in agent_ids:
                            agent_ids.append(request.agent_id)
                            client.agent_id = ",".join(agent_ids)
                else:
                    client.agent_id = json.dumps([request.agent_id])

            # Set up calendar sharing between agent and client
            try:
                from ...services.calendar.core import google_calendar_service

                sharing_result = google_calendar_service.setup_agent_client_calendar_sharing(
                    agent_id=request.agent_id,
                    client_id=request.client_id,
                    agent_email=agent.email,
                    client_email=client.email,
                    db_session=db.session,
                )

                if sharing_result.get("success"):
                    logger.info(
                        f"Calendar sharing set up successfully between agent {request.agent_id} and client {request.client_id}"
                    )
                else:
                    # Log but don't fail the relationship creation
                    errors = sharing_result.get("errors", [])
                    logger.warning(
                        f"Calendar sharing setup had issues for agent {request.agent_id} and client {request.client_id}: {errors}"
                    )
            except Exception as e:
                # Log but don't fail the relationship creation if calendar setup fails
                logger.error(
                    f"Error setting up calendar sharing for agent {request.agent_id} and client {request.client_id}: {e}",
                    exc_info=True,
                )

        db.session.commit()

        return request.to_dict()

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error responding to connection request: {e}", exc_info=True)
        raise
