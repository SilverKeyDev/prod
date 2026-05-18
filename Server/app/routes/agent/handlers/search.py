"""Agent search endpoints (search agents, search clients)."""

import logging

from flask import jsonify, request
from jose.exceptions import ExpiredSignatureError, JWTError

from app.schemas.generated import (
    RecommendedAgentsResponse,
    SearchAgentsResponse,
    SearchClientsResponse,
)
from app.services.agent import recommend_agents, search_agents, search_clients
from app.services.agent.client_service import get_connected_agent_ids_for_client
from app.services.auth import SecurityException, get_current_user
from app.utils.common_patterns import handle_exceptions_with_logging, require_agent_access
from app.utils.security import SecurityError, rate_limit, security_error_response
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation import validate_response

logger = logging.getLogger(__name__)


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(SearchAgentsResponse)
def search_agents_endpoint():
    """Search for agents (for clients)"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        query = request.args.get("q", "").strip()
        limit = int(request.args.get("limit", 20))
        if len(query) < 2:
            return jsonify({"success": True, "agents": []})
        agents = search_agents(query, limit)
        return jsonify({"success": True, "agents": agents})
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "search_agents", "user_id": "unknown"}
        )


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(RecommendedAgentsResponse)
def recommended_agents_endpoint():
    """Recommend agents for the current user from optional buyer/search context."""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        zip_code = request.args.get("zip", "").strip() or None
        state = request.args.get("state", "").strip() or None
        intent = request.args.get("intent", "").strip() or None
        limit = int(request.args.get("limit", 20))
        excluded: set[str] = set()
        if user.id and not user.is_agent:
            excluded = get_connected_agent_ids_for_client(user.id)
        agents = recommend_agents(zip_code, state, intent, limit, exclude_agent_ids=excluded)
        return jsonify({"success": True, "agents": agents})
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "recommended_agents", "user_id": "unknown"}
        )


@rate_limit(max_requests=100, window_seconds=60)
@validate_response(SearchClientsResponse)
@handle_exceptions_with_logging
@require_agent_access
def search_clients_endpoint(user):
    """Search for clients (for agents)"""
    try:
        query = request.args.get("q", "").strip()
        limit = int(request.args.get("limit", 20))
        if len(query) < 2:
            return jsonify({"success": True, "clients": []})
        if not user.id:
            logger.error("User ID is None in search_clients_endpoint")
            return jsonify({"success": False, "error": "Invalid user session"}), 401
        clients = search_clients(query, user.id, limit)
        return jsonify({"success": True, "clients": clients})
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "search_clients", "user_id": getattr(user, "id", "unknown")}
        )
