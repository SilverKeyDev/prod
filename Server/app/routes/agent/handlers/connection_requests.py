"""Agent connection request endpoints."""

from flask import jsonify, request

from app.routes.agent.handlers._errors import agent_value_error_response
from app.schemas import (
    ConnectionRequestsResponse,
    CreateConnectionRequestRequest,
    CreateConnectionRequestResponse,
    RespondToConnectionRequestRequest,
    RespondToConnectionRequestResponse,
)
from app.services.agent import (
    create_connection_request,
    get_connection_requests,
    respond_to_connection_request,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    forbidden,
    handle_exceptions_with_logging,
    invalid_request,
    require_authenticated_user,
    server_error,
    unauthorized,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(ConnectionRequestsResponse)
def get_connection_requests_endpoint(user):
    """Get connection requests for authenticated user"""
    if not user.id:
        log.error("AUTH", "User ID is None in get_connection_requests_endpoint")
        return unauthorized()
    scope = (request.args.get("scope") or "inbox").strip().lower()
    if scope not in ("inbox", "initiated"):
        return invalid_request("scope must be 'inbox' or 'initiated'")
    requests_list = get_connection_requests(user.id, user_is_agent(user), scope=scope)
    return jsonify({"success": True, "requests": requests_list})


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(CreateConnectionRequestRequest)
@validate_response(CreateConnectionRequestResponse)
def create_connection_request_endpoint(user, data: CreateConnectionRequestRequest):
    """Create a connection request"""
    if not user.id:
        log.error("AUTH", "User ID is None in create_connection_request_endpoint")
        return unauthorized()
    try:
        request_data = data.model_dump(mode="json")
        agent_id = request_data["agent_id"]
        client_id = request_data["client_id"]
        message = request_data.get("message")
        if not agent_id or not client_id:
            return invalid_request("agent_id and client_id are required")
        if user_is_agent(user):
            if user.id != agent_id:
                return forbidden()
            requested_by_agent = True
        else:
            if user.id != client_id:
                return forbidden()
            requested_by_agent = False
        result = create_connection_request(agent_id, client_id, requested_by_agent, message)

        from app.services.analytics.posthog_events import capture_product_event

        if not result.get("already_pending"):
            capture_product_event(
                str(user.id),
                "agent_connection_requested",
                properties={"requested_by_agent": requested_by_agent},
            )

        return jsonify(
            {
                "success": True,
                "request": result["request"],
                "already_pending": result["already_pending"],
            }
        )
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(
            e, {"function": "create_connection_request", "user_id": getattr(user, "id", "unknown")}
        )


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(RespondToConnectionRequestRequest)
@validate_response(RespondToConnectionRequestResponse)
def respond_to_connection_request_endpoint(
    user, request_id, data: RespondToConnectionRequestRequest
):
    """Accept or reject a connection request"""
    if not user.id:
        log.error("AUTH", "User ID is None in respond_to_connection_request_endpoint")
        return unauthorized()
    try:
        accept = data.accept
        request_obj = respond_to_connection_request(
            request_id, user.id, user_is_agent(user), accept
        )

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "agent_connection_responded",
            properties={"accepted": accept},
        )

        return jsonify({"success": True, "request": request_obj})
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(
            e,
            {
                "function": "respond_to_connection_request",
                "user_id": getattr(user, "id", "unknown"),
            },
        )
