"""Agent list and client-agent assignment handlers."""

from flask import jsonify, request
from jose import jwt as jose_jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWTError

from app import db
from app.models import User
from app.schemas import (
    AddAgentResponse,
    RemoveAgentResponse,
    SearchAgentsResponse,
    UserAgentsResponse,
)
from app.services.agent.client_service import get_connected_agent_ids_for_client
from app.services.auth.agent_connections import (
    create_agent_connection,
    delete_agent_connection,
    find_agent_connection,
    find_user_by_cognito_id,
)
from app.services.auth.tokens import (
    AWS_COGNITO_ISSUER,
)
from app.services.auth.tokens import (
    get_signing_key_for_cognito_rs256 as get_signing_key,
)
from app.services.auth.user_role_helpers import (
    get_user_if_agent,
    user_is_agent,
    users_with_role_select,
)
from app.utils.common_patterns import (
    conflict,
    forbidden,
    not_found,
    require_authenticated_user,
    server_error,
    unauthorized,
    validation,
)
from app.utils.validation import validate_response
from logger import log


def _agent_summary(agent: User) -> dict:
    return {
        "id": agent.id,
        "name": agent.name,
        "email": agent.email,
        "phone": agent.phone,
        "created_at": agent.created_at.isoformat() if agent.created_at else None,
    }


def _decode_bearer_user_id():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        log.warn("AUTH", "preferences_agents_no_auth_header", None)
        return None, unauthorized()
    token = auth_header.split(" ")[1]
    try:
        key = get_signing_key(token)
        decoded_token = jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            issuer=AWS_COGNITO_ISSUER,
            options={
                "verify_signature": True,
                "verify_aud": False,
                "verify_iss": True,
                "verify_exp": True,
            },
        )
        user_id = decoded_token.get("sub")
        if not user_id:
            log.error("AUTH", "preferences_agents_no_user_id_in_token", None)
            return None, unauthorized()
    except (ExpiredSignatureError, JWTClaimsError, JWTError):
        log.error("AUTH", "preferences_agents_jwt_verification_failed", None)
        return None, unauthorized()
    return user_id, None


@validate_response(SearchAgentsResponse)
def get_agents():
    """Get all agents whose names start with the provided search string."""
    try:
        search_term = request.args.get("search", "").strip()
        stmt = users_with_role_select("agent")
        if search_term:
            stmt = stmt.where(User.name.ilike(f"{search_term}%"))
        agents = db.session.scalars(stmt).all()
        agent_list = [_agent_summary(agent) for agent in agents]
        return jsonify({"success": True, "agents": agent_list, "count": len(agent_list)}), 200
    except Exception as e:
        log.error("AUTH", "preferences_agents_fetch_failed", e)
        return server_error(e, context={"function": "get_agents"})


@validate_response(AddAgentResponse)
def set_as_agent():
    """Link the current user to an agent via ``agent_conversations``."""
    try:
        user_id, auth_err = _decode_bearer_user_id()
        if auth_err:
            return auth_err

        agent_id = request.args.get("agent_id")
        if not agent_id:
            log.warn("AUTH", "preferences_agents_missing_agent_id", None)
            return validation(
                "agent_id parameter is required",
                field_errors={"agent_id": "Required"},
            )
        current_user = find_user_by_cognito_id(user_id)
        if not current_user:
            log.error(
                "AUTH",
                "preferences_agents_user_not_found",
                {"cognito_id_prefix": user_id[:8] if user_id else None},
            )
            return not_found("User not found")
        if user_is_agent(current_user):
            log.warn(
                "AUTH",
                "preferences_agents_self_assign_blocked",
                {"user_id": str(current_user.id)},
            )
            return forbidden()
        agent = get_user_if_agent(agent_id)
        if not agent:
            log.error("AUTH", "preferences_agents_agent_not_found", {"agent_id": agent_id})
            return not_found("Agent not found")
        existing = find_agent_connection(agent_id, current_user.id)
        if existing:
            log.info(
                "AUTH",
                "preferences_agents_already_assigned",
                {"user_id": str(current_user.id), "agent_id": agent_id},
            )
            return conflict("User is already assigned to this agent")
        create_agent_connection(agent_id, current_user.id)
        return jsonify(
            {
                "success": True,
                "message": f"Successfully assigned agent {agent.name} to user {current_user.name}",
                "agent": _agent_summary(agent),
            }
        ), 200
    except Exception as e:
        log.error("AUTH", "preferences_agents_assign_failed", e)
        db.session.rollback()
        return server_error(e, context={"function": "set_as_agent"})


@require_authenticated_user
@validate_response(UserAgentsResponse)
def get_user_agents(user):
    """Get all agents linked to the authenticated user via ``agent_conversations``."""
    try:
        agent_ids = list(get_connected_agent_ids_for_client(user.id))
        if not agent_ids:
            return jsonify({"success": True, "agents": [], "count": 0}), 200
        agents = db.session.scalars(
            users_with_role_select("agent").where(User.id.in_(agent_ids))
        ).all()
        by_id = {a.id: a for a in agents}
        agent_list = [_agent_summary(by_id[aid]) for aid in agent_ids if aid in by_id]
        return jsonify({"success": True, "agents": agent_list, "count": len(agent_list)}), 200
    except Exception as e:
        log.error("AUTH", "preferences_agents_fetch_user_agents_failed", e)
        return server_error(e, context={"function": "get_user_agents"})


@validate_response(RemoveAgentResponse)
def remove_agent_relationship():
    """Remove the agent-client link from ``agent_conversations``."""
    try:
        user_id, auth_err = _decode_bearer_user_id()
        if auth_err:
            return auth_err

        agent_id = request.args.get("agent_id")
        if not agent_id:
            log.warn("AUTH", "preferences_agents_missing_agent_id", None)
            return validation(
                "agent_id parameter is required",
                field_errors={"agent_id": "Required"},
            )
        current_user = find_user_by_cognito_id(user_id)
        if not current_user:
            log.error(
                "AUTH",
                "preferences_agents_user_not_found",
                {"cognito_id_prefix": user_id[:8] if user_id else None},
            )
            return not_found("User not found")
        if user_is_agent(current_user):
            log.warn(
                "AUTH",
                "preferences_agents_self_remove_blocked",
                {"user_id": str(current_user.id)},
            )
            return forbidden()
        agent = get_user_if_agent(agent_id)
        if not agent:
            log.error("AUTH", "preferences_agents_agent_not_found", {"agent_id": agent_id})
            return not_found("Agent not found")
        connection = find_agent_connection(agent_id, current_user.id)
        if not connection:
            log.info(
                "AUTH",
                "preferences_agents_not_assigned",
                {"user_id": str(current_user.id), "agent_id": agent_id},
            )
            return conflict("User is not assigned to this agent")
        delete_agent_connection(connection)
        return jsonify(
            {
                "success": True,
                "message": f"Successfully removed agent {agent.name} from user {current_user.name}",
                "agent": _agent_summary(agent),
            }
        ), 200
    except Exception as e:
        log.error("AUTH", "preferences_agents_remove_failed", e)
        db.session.rollback()
        return server_error(e, context={"function": "remove_agent_relationship"})
