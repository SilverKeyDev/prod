"""
Service functions for managing agent-client connection requests.

Connection policy (asymmetric by design):
- Client → agent: auto-accepted on create; agents never get an inbox to approve clients.
- Agent → client: stays pending until the client accepts or rejects via their inbox,
  because clients may not want to connect with every agent.
"""

import logging
from datetime import datetime, timezone

from ... import db
from ...models import AgentConnectionRequest, AgentConnections, User
from .client_service import append_unique_agent_id_for_client, append_unique_client_id
from .connection_request_discovery import (
    recommend_agents,
    search_agents,
    search_clients,
)

logger = logging.getLogger(__name__)

__all__ = [
    "recommend_agents",
    "search_agents",
    "search_clients",
    "get_connection_requests",
    "create_connection_request",
    "respond_to_connection_request",
]


def _serialize_connection_request(req: AgentConnectionRequest, is_agent: bool) -> dict:
    if is_agent:
        other_party = User.query.filter_by(id=req.client_id).first()
    else:
        other_party = User.query.filter_by(id=req.agent_id).first()
    return {
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


def get_connection_requests(user_id: str, is_agent: bool, scope: str = "inbox") -> list[dict]:
    """
    Get connection requests for a user.

    Args:
        user_id: The ID of the user
        is_agent: Whether the user is an agent
        scope: ``inbox`` (default) — pending requests awaiting the user's response;
               ``initiated`` — requests this user sent (all statuses).

    Returns:
        List of connection request dictionaries
    """
    try:
        if scope == "initiated":
            if is_agent:
                requests = (
                    AgentConnectionRequest.query.filter_by(
                        agent_id=user_id, requested_by_agent=True
                    )
                    .order_by(AgentConnectionRequest.updated_at.desc())
                    .all()
                )
            else:
                requests = (
                    AgentConnectionRequest.query.filter_by(
                        client_id=user_id, requested_by_agent=False
                    )
                    .order_by(AgentConnectionRequest.updated_at.desc())
                    .all()
                )
        elif is_agent:
            # Incoming only: clients who requested this agent
            requests = AgentConnectionRequest.query.filter_by(
                agent_id=user_id, status="pending", requested_by_agent=False
            ).all()
        else:
            # Incoming only: agents who requested this client
            requests = AgentConnectionRequest.query.filter_by(
                client_id=user_id, status="pending", requested_by_agent=True
            ).all()

        return [_serialize_connection_request(req, is_agent) for req in requests]

    except Exception as e:
        logger.error(f"Error fetching connection requests: {e}", exc_info=True)
        raise


def _apply_connection_acceptance(request: AgentConnectionRequest) -> None:
    """Mark a request accepted and create relationship + optional calendar sharing."""
    now = datetime.now(timezone.utc)
    request.status = "accepted"
    request.responded_at = now
    request.updated_at = now

    existing_conv = AgentConnections.query.filter_by(
        agent_id=request.agent_id, client_id=request.client_id
    ).first()

    if not existing_conv:
        conversation = AgentConnections(agent_id=request.agent_id, client_id=request.client_id)
        db.session.add(conversation)

    agent = User.query.filter_by(id=request.agent_id).first()
    client = User.query.filter_by(id=request.client_id).first()

    if agent:
        append_unique_client_id(agent, request.client_id)
    if client:
        append_unique_agent_id_for_client(client, request.agent_id)

    try:
        from ...services.calendar.core import google_calendar_service

        sharing_result = google_calendar_service.setup_agent_client_calendar_sharing(
            agent_id=request.agent_id,
            client_id=request.client_id,
            agent_email=agent.email if agent else None,
            client_email=client.email if client else None,
            db_session=db.session,
        )

        if sharing_result.get("success"):
            logger.info(
                f"Calendar sharing set up successfully between agent {request.agent_id} and client {request.client_id}"
            )
        else:
            errors = sharing_result.get("errors", [])
            logger.warning(
                f"Calendar sharing setup had issues for agent {request.agent_id} and client {request.client_id}: {errors}"
            )
    except Exception as e:
        logger.error(
            f"Error setting up calendar sharing for agent {request.agent_id} and client {request.client_id}: {e}",
            exc_info=True,
        )


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
            # Client-initiated pendings are auto-accepted (including legacy rows on retry).
            if not existing.requested_by_agent and existing.status == "pending":
                _apply_connection_acceptance(existing)
                db.session.commit()
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
        if not requested_by_agent:
            _apply_connection_acceptance(request)
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
            raise ValueError(
                "Client-initiated connection requests are accepted automatically; "
                "agents do not accept or reject via the inbox."
            )

        if request.status != "pending":
            raise ValueError(f"Request already {request.status}")

        now = datetime.now(timezone.utc)
        if accept:
            _apply_connection_acceptance(request)
        else:
            request.status = "rejected"
            request.responded_at = now
            request.updated_at = now

        db.session.commit()

        return request.to_dict()

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error responding to connection request: {e}", exc_info=True)
        raise
