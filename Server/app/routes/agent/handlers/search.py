"""Agent search endpoints (search agents, search clients)."""

from flask import jsonify

from app.schemas.generated import (
    AgentRecommendQueryParams,
    AgentSearchQueryParams,
    RecommendedAgentsResponse,
    SearchAgentsResponse,
    SearchClientsResponse,
)
from app.services.agent import recommend_agents, search_agents, search_clients
from app.services.agent.client_service import get_connected_agent_ids_for_client
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_agent_access,
    require_authenticated_user,
    server_error,
    unauthorized,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_response
from logger import log


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@validate_query(AgentSearchQueryParams)
@validate_response(SearchAgentsResponse)
@require_authenticated_user
def search_agents_endpoint(user, query: AgentSearchQueryParams | None = None):
    """Search for agents (for clients)"""
    params = query or AgentSearchQueryParams()
    search_query = (params.q or "").strip()
    limit = params.limit or 20
    if len(search_query) < 2:
        return jsonify({"success": True, "agents": []})
    agents = search_agents(search_query, limit)
    return jsonify({"success": True, "agents": agents})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@validate_query(AgentRecommendQueryParams)
@validate_response(RecommendedAgentsResponse)
@require_authenticated_user
def recommended_agents_endpoint(user, query: AgentRecommendQueryParams | None = None):
    """Recommend agents for the current user from optional buyer/search context."""
    params = query or AgentRecommendQueryParams()
    zip_code = (params.zip or "").strip() or None
    state = (params.state or "").strip() or None
    intent = (params.intent or "").strip() or None
    limit = params.limit or 20
    excluded: set[str] = set()
    if user.id and not user_is_agent(user):
        excluded = get_connected_agent_ids_for_client(user.id)
    agents = recommend_agents(zip_code, state, intent, limit, exclude_agent_ids=excluded)
    return jsonify({"success": True, "agents": agents})


@rate_limit(max_requests=100, window_seconds=60)
@validate_query(AgentSearchQueryParams)
@validate_response(SearchClientsResponse)
@handle_exceptions_with_logging
@require_agent_access
def search_clients_endpoint(user, query: AgentSearchQueryParams | None = None):
    """Search for clients (for agents)"""
    if not user.id:
        log.error("AUTH", "User ID is None in search_clients_endpoint")
        return unauthorized()
    params = query or AgentSearchQueryParams()
    search_query = (params.q or "").strip()
    limit = params.limit or 20
    if len(search_query) < 2:
        return jsonify({"success": True, "clients": []})
    try:
        clients = search_clients(search_query, user.id, limit)
        return jsonify({"success": True, "clients": clients})
    except Exception as e:
        return server_error(
            e, {"function": "search_clients", "user_id": getattr(user, "id", "unknown")}
        )
