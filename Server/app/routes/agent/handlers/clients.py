"""Agent clients endpoint."""

from flask import jsonify

from app.services.agent import get_agent_clients
from app.utils.common_patterns import handle_exceptions_with_logging, require_agent_access
from app.utils.security.security import rate_limit


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def get_clients(user):
    """Get list of clients for authenticated agent"""
    clients = get_agent_clients(user.id)
    return jsonify({"success": True, "clients": clients})
