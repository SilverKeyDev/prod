"""
Service functions for managing agent-client connection requests.

Connection policy (asymmetric by design):
- Client → agent: auto-accepted on create; agents never get an inbox to approve clients.
- Agent → client: stays pending until the client accepts or rejects via their inbox,
  because clients may not want to connect with every agent.
"""

from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.dtos.agent_connection_request import AgentConnectionRequestDTO
from app.services.agent.connection_request.discovery import (
    recommend_agents,
    search_agents,
    search_clients,
)
from app.services.auth.user_role_helpers import get_user_if_agent, user_is_agent
from logger import log

from ...models import AgentConnectionRequest, AgentConnections, User

__all__ = [
    "recommend_agents",
    "search_agents",
    "search_clients",
    "get_connection_requests",
    "create_connection_request",
    "respond_to_connection_request",
]


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
                requests = db.session.scalars(
                    select(AgentConnectionRequest)
                    .where(
                        AgentConnectionRequest.agent_id == user_id,
                        AgentConnectionRequest.requested_by_agent.is_(True),
                    )
                    .order_by(AgentConnectionRequest.updated_at.desc())
                ).all()
            else:
                requests = db.session.scalars(
                    select(AgentConnectionRequest)
                    .where(
                        AgentConnectionRequest.client_id == user_id,
                        AgentConnectionRequest.requested_by_agent.is_(False),
                    )
                    .order_by(AgentConnectionRequest.updated_at.desc())
                ).all()
        elif is_agent:
            requests = db.session.scalars(
                select(AgentConnectionRequest).where(
                    AgentConnectionRequest.agent_id == user_id,
                    AgentConnectionRequest.status == "pending",
                    AgentConnectionRequest.requested_by_agent.is_(False),
                )
            ).all()
        else:
            requests = db.session.scalars(
                select(AgentConnectionRequest).where(
                    AgentConnectionRequest.client_id == user_id,
                    AgentConnectionRequest.status == "pending",
                    AgentConnectionRequest.requested_by_agent.is_(True),
                )
            ).all()
        return [AgentConnectionRequestDTO.to_response(req, is_agent=is_agent) for req in requests]
    except Exception as e:
        log.error("ERRORS", f"Error fetching connection requests: {e}")
        raise


def _apply_connection_acceptance(request: AgentConnectionRequest) -> None:
    """Mark a request accepted and create relationship + optional calendar sharing."""
    now = datetime.now(timezone.utc)
    request.status = "accepted"
    request.responded_at = now
    request.updated_at = now
    existing_conv = db.session.scalar(
        select(AgentConnections).where(
            AgentConnections.agent_id == request.agent_id,
            AgentConnections.client_id == request.client_id,
        )
    )
    if not existing_conv:
        conversation = AgentConnections(agent_id=request.agent_id, client_id=request.client_id)
        db.session.add(conversation)
    from app.services.brokerage.membership import ensure_org_membership
    from app.services.transactions.ensure import ensure_transaction

    ensure_transaction(buyer_id=str(request.client_id), primary_agent_id=str(request.agent_id))
    ensure_org_membership(str(request.client_id), role="member")
    agent = db.session.scalar(select(User).where(User.id == request.agent_id))
    client = db.session.scalar(select(User).where(User.id == request.client_id))
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
            log.info(
                "API",
                f"Calendar sharing set up successfully between agent {request.agent_id} and client {request.client_id}",
            )
        else:
            errors = sharing_result.get("errors", [])
            log.warn(
                "API",
                f"Calendar sharing setup had issues for agent {request.agent_id} and client {request.client_id}: {errors}",
            )
    except Exception as e:
        log.error(
            "ERRORS",
            f"Error setting up calendar sharing for agent {request.agent_id} and client {request.client_id}: {e}",
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
        existing = db.session.scalar(
            select(AgentConnectionRequest).where(
                AgentConnectionRequest.agent_id == agent_id,
                AgentConnectionRequest.client_id == client_id,
                AgentConnectionRequest.status == "pending",
            )
        )
        if existing:
            if not existing.requested_by_agent and existing.status == "pending":
                _apply_connection_acceptance(existing)
                db.session.commit()
            return {
                "request": AgentConnectionRequestDTO.to_response(
                    existing, is_agent=requested_by_agent
                ),
                "already_pending": True,
            }
        agent = get_user_if_agent(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        client = db.session.scalar(select(User).where(User.id == client_id))
        if not client or user_is_agent(client):
            raise ValueError(f"Client {client_id} not found")
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
        return {
            "request": AgentConnectionRequestDTO.to_response(request, is_agent=requested_by_agent),
            "already_pending": False,
        }
    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", f"Error creating connection request: {e}")
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
        request = db.session.scalar(
            select(AgentConnectionRequest).where(AgentConnectionRequest.id == request_id)
        )
        if not request:
            raise ValueError(f"Connection request {request_id} not found")
        if request.requested_by_agent:
            if is_agent or request.client_id != user_id:
                raise ValueError("Only the invited client can respond to this request")
        else:
            if not is_agent or request.agent_id != user_id:
                raise ValueError("Only the invited agent can respond to this request")
            raise ValueError(
                "Client-initiated connection requests are accepted automatically; agents do not accept or reject via the inbox."
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
        return AgentConnectionRequestDTO.to_response(request, is_agent=is_agent)
    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", f"Error responding to connection request: {e}")
        raise
