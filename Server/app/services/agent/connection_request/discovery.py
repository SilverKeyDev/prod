"""Agent and client discovery helpers for connection requests (search and recommendations)."""

import logging
from datetime import datetime, timezone

from app import db
from app.models import User, UserAgentProfile
from app.services.agent.connection_request.helpers import (
    agent_row_base,
    normalize_state,
    normalize_zip,
    tokenize,
)
from app.utils.format.json_string_list_parse import parse_json_or_csv_string_list

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
    Search for agents by name or email.

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
    Search for clients by name or email (for agents).

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
