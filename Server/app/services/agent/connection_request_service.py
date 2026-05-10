"""
Service functions for managing agent-client connection requests
"""

import logging
from datetime import datetime, timezone

from ... import db
from ...models import AgentConnectionRequest, AgentConnections, User, UserAgentProfile
from ...utils.json_string_list_parse import parse_json_or_csv_string_list
from .client_service import append_unique_agent_id_for_client, append_unique_client_id
from .connection_request_helpers import (
    agent_row_base,
    normalize_state,
    normalize_zip,
    tokenize,
)

logger = logging.getLogger(__name__)


def recommend_agents(
    zip_code: str | None,
    state: str | None,
    intent: str | None,
    limit: int = 20,
    exclude_agent_ids: set[str] | None = None,
) -> list[dict]:
    """
    Rank agents using v1 heuristics: primary_service_zips, licensed_states, specialties/bio vs intent.

    When zip, state, and intent are all empty, returns recent agents with relevance_score 0 (fallback).
    """
    try:
        limit = max(1, min(int(limit), 100))
        zip_norm = normalize_zip(zip_code)
        state_norm = normalize_state(state)
        intent_clean = intent.strip() if intent else ""
        intent_tokens = tokenize(intent_clean)
        has_signals = bool(zip_norm or state_norm or intent_tokens)

        rows = (
            db.session.query(User, UserAgentProfile)
            .outerjoin(UserAgentProfile, User.id == UserAgentProfile.user_id)
            .filter(User.is_agent.is_(True))
            .all()
        )

        scored: list[tuple[float, datetime | None, dict]] = []
        for agent, profile in rows:
            score = 0.0
            reasons: list[str] = []

            if zip_norm and profile and profile.primary_service_zips:
                zips_raw = parse_json_or_csv_string_list(profile.primary_service_zips)
                zips_n = {z for z in (normalize_zip(x) for x in zips_raw) if z}
                if zip_norm in zips_n:
                    score += 5.0
                    reasons.append("zip")

            if state_norm and profile and profile.licensed_states:
                states_raw = parse_json_or_csv_string_list(profile.licensed_states)
                states_u = {s.strip().upper() for s in states_raw if s and len(s.strip()) >= 2}
                if state_norm in states_u:
                    score += 3.0
                    reasons.append("state")

            if intent_tokens and profile:
                specs = parse_json_or_csv_string_list(profile.specialties)
                bio = profile.agent_bio or ""
                corpus_tokens = tokenize(" ".join(specs) + " " + bio)
                overlap = intent_tokens & corpus_tokens
                if overlap:
                    score += float(min(5, len(overlap)))
                    reasons.append("specialty")

            row = {
                **agent_row_base(agent, profile),
                "relevance_score": score,
                "match_reasons": reasons or None,
            }
            created = agent.created_at
            scored.append((score, created, row))

        def _sort_ts(dt: datetime | None) -> datetime:
            if dt is None:
                return datetime(1970, 1, 1, tzinfo=timezone.utc)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt

        scored.sort(key=lambda t: (t[0], _sort_ts(t[1])), reverse=True)
        excluded = exclude_agent_ids or set()
        if has_signals:
            out_rows = [t[2] for t in scored if t[2]["id"] not in excluded][:limit]
            return out_rows

        # Fallback: no signals from client — recent agents, neutral score
        q = User.query.filter(User.is_agent.is_(True))
        if excluded:
            q = q.filter(~User.id.in_(list(excluded)))
        recent = q.order_by(User.created_at.desc()).limit(limit).all()
        result = []
        for a in recent:
            prof = db.session.get(UserAgentProfile, a.id)
            result.append(
                {
                    **agent_row_base(a, prof),
                    "relevance_score": 0.0,
                    "match_reasons": None,
                }
            )
        return result

    except Exception as e:
        logger.error(f"Error recommending agents: {e}", exc_info=True)
        raise


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
            result.append(agent_row_base(agent))

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
        request.responded_at = datetime.now(timezone.utc)
        request.updated_at = datetime.now(timezone.utc)

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

            if agent:
                append_unique_client_id(agent, request.client_id)
            if client:
                append_unique_agent_id_for_client(client, request.agent_id)

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
