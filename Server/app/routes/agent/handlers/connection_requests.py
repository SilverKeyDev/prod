"""Agent connection request endpoints."""

import logging

from flask import jsonify, request

from app.services.agent import (
    create_connection_request,
    get_connection_requests,
    respond_to_connection_request,
)
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import rate_limit

logger = logging.getLogger(__name__)


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_connection_requests_endpoint(user):
    """Get connection requests for authenticated user"""
    if not user.id:
        logger.error("User ID is None in get_connection_requests_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    requests_list = get_connection_requests(user.id, bool(user.is_agent))
    return jsonify({"success": True, "requests": requests_list})


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def create_connection_request_endpoint(user):
    """Create a connection request"""
    if not user.id:
        logger.error("User ID is None in create_connection_request_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        data = request.get_json(force=True)
        agent_id = data.get("agent_id")
        client_id = data.get("client_id")
        message = data.get("message")
        if not agent_id or not client_id:
            return jsonify({"success": False, "error": "agent_id and client_id are required"}), 400
        if user.is_agent:
            if user.id != agent_id:
                return jsonify(
                    {"success": False, "error": "Agent can only request connections for themselves"}
                ), 403
            requested_by_agent = True
        else:
            if user.id != client_id:
                return jsonify(
                    {
                        "success": False,
                        "error": "Client can only request connections for themselves",
                    }
                ), 403
            requested_by_agent = False
        request_obj = create_connection_request(agent_id, client_id, requested_by_agent, message)
        return jsonify({"success": True, "request": request_obj})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "create_connection_request", "user_id": getattr(user, "id", "unknown")}
        )


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def respond_to_connection_request_endpoint(user, request_id):
    """Accept or reject a connection request"""
    if not user.id:
        logger.error("User ID is None in respond_to_connection_request_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        data = request.get_json(force=True)
        accept = data.get("accept", False)
        request_obj = respond_to_connection_request(
            request_id, user.id, bool(user.is_agent), accept
        )
        return jsonify({"success": True, "request": request_obj})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e,
            {
                "function": "respond_to_connection_request",
                "user_id": getattr(user, "id", "unknown"),
            },
        )
