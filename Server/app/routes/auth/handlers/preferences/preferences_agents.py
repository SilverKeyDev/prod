"""Agent list and client-agent assignment handlers."""

from flask import jsonify, request
from jose import jwt as jose_jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWTError

from app import db
from app.models import AgentConnections, User
from app.schemas import (
    AddAgentResponse,
    RemoveAgentResponse,
    SearchAgentsResponse,
    UserAgentsResponse,
)
from app.services.agent.client_service import get_connected_agent_ids_for_client
from app.services.auth import get_current_user
from app.services.auth.tokens import (
    AWS_COGNITO_ISSUER,
)
from app.services.auth.tokens import (
    get_signing_key_for_cognito_rs256 as get_signing_key,
)
from app.services.auth.user_role_helpers import (
    get_user_if_agent,
    user_is_agent,
    users_with_role_query,
)
from app.utils.security.app_logging import get_logger
from app.utils.validation import validate_response

logger = get_logger()


def _agent_summary(agent: User) -> dict:
    return {
        "id": agent.id,
        "name": agent.name,
        "email": agent.email,
        "phone": agent.phone,
        "created_at": agent.created_at.isoformat() if agent.created_at else None,
    }


@validate_response(SearchAgentsResponse)
def get_agents():
    """Get all agents whose names start with the provided search string."""
    try:
        search_term = request.args.get("search", "").strip()
        query = users_with_role_query("agent")
        if search_term:
            query = query.filter(User.name.ilike(f"{search_term}%"))
        agents = query.all()
        agent_list = [_agent_summary(agent) for agent in agents]
        return jsonify({"success": True, "agents": agent_list, "count": len(agent_list)}), 200
    except Exception as e:
        logger.error("Failed to fetch agents: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Failed to fetch agents"}), 500


@validate_response(AddAgentResponse)
def set_as_agent():
    """Link the current user to an agent via ``agent_conversations``."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning("No valid authorization header found")
            return jsonify({"success": False, "error": "Authorization required"}), 401
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
                logger.error("No user ID found in token")
                return jsonify({"success": False, "error": "Invalid token"}), 401
        except (ExpiredSignatureError, JWTClaimsError, JWTError) as e:
            logger.error("JWT verification failed: %s", str(e))
            return jsonify({"success": False, "error": "Token verification failed"}), 401
        agent_id = request.args.get("agent_id")
        if not agent_id:
            logger.warning("No agent_id provided in request")
            return jsonify({"success": False, "error": "agent_id parameter is required"}), 400
        current_user = User.query.filter_by(cognito_id=user_id).first()
        if not current_user:
            logger.error("User not found with cognito_id: %s", user_id)
            return jsonify({"success": False, "error": "User not found"}), 404
        if user_is_agent(current_user):
            logger.warning("Agent %s attempted to assign themselves as a client.", current_user.id)
            return jsonify(
                {"success": False, "error": "Agents cannot assign themselves as clients"}
            ), 403
        agent = get_user_if_agent(agent_id)
        if not agent:
            logger.error("Agent not found with id: %s", agent_id)
            return jsonify({"success": False, "error": "Agent not found"}), 404
        existing = AgentConnections.query.filter_by(
            agent_id=agent_id, client_id=current_user.id
        ).first()
        if existing:
            logger.info("User %s is already assigned to agent %s", current_user.id, agent_id)
            return jsonify(
                {"success": False, "error": "User is already assigned to this agent"}
            ), 409
        db.session.add(AgentConnections(agent_id=agent_id, client_id=current_user.id))
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "message": f"Successfully assigned agent {agent.name} to user {current_user.name}",
                "agent": _agent_summary(agent),
            }
        ), 200
    except Exception as e:
        logger.error("Failed to assign agent: %s", str(e), exc_info=True)
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to assign agent"}), 500


@validate_response(UserAgentsResponse)
def get_user_agents():
    """Get all agents linked to the authenticated user via ``agent_conversations``."""
    try:
        current_user = get_current_user()
        if not current_user:
            logger.error("User not found")
            return jsonify({"success": False, "error": "User not found"}), 404
        agent_ids = list(get_connected_agent_ids_for_client(current_user.id))
        if not agent_ids:
            return jsonify({"success": True, "agents": [], "count": 0}), 200
        agents = users_with_role_query("agent").filter(User.id.in_(agent_ids)).all()  # pyright: ignore[reportAttributeAccessIssue]
        by_id = {a.id: a for a in agents}
        agent_list = [_agent_summary(by_id[aid]) for aid in agent_ids if aid in by_id]
        return jsonify({"success": True, "agents": agent_list, "count": len(agent_list)}), 200
    except Exception as e:
        logger.error("Failed to fetch user agents: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Failed to fetch user agents"}), 500


@validate_response(RemoveAgentResponse)
def remove_agent_relationship():
    """Remove the agent-client link from ``agent_conversations``."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning("No valid authorization header found")
            return jsonify({"success": False, "error": "Authorization required"}), 401
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
                logger.error("No user ID found in token")
                return jsonify({"success": False, "error": "Invalid token"}), 401
        except (ExpiredSignatureError, JWTClaimsError, JWTError) as e:
            logger.error("JWT verification failed: %s", str(e))
            return jsonify({"success": False, "error": "Token verification failed"}), 401
        agent_id = request.args.get("agent_id")
        if not agent_id:
            logger.warning("No agent_id provided in request")
            return jsonify({"success": False, "error": "agent_id parameter is required"}), 400
        current_user = User.query.filter_by(cognito_id=user_id).first()
        if not current_user:
            logger.error("User not found with cognito_id: %s", user_id)
            return jsonify({"success": False, "error": "User not found"}), 404
        if user_is_agent(current_user):
            logger.warning("Agent %s attempted to remove themselves as a client.", current_user.id)
            return jsonify(
                {"success": False, "error": "Agents cannot remove themselves as clients"}
            ), 403
        agent = get_user_if_agent(agent_id)
        if not agent:
            logger.error("Agent not found with id: %s", agent_id)
            return jsonify({"success": False, "error": "Agent not found"}), 404
        connection = AgentConnections.query.filter_by(
            agent_id=agent_id, client_id=current_user.id
        ).first()
        if not connection:
            logger.info("User %s is not assigned to agent %s", current_user.id, agent_id)
            return jsonify({"success": False, "error": "User is not assigned to this agent"}), 409
        db.session.delete(connection)
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "message": f"Successfully removed agent {agent.name} from user {current_user.name}",
                "agent": _agent_summary(agent),
            }
        ), 200
    except Exception as e:
        logger.error("Failed to remove agent: %s", str(e), exc_info=True)
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to remove agent"}), 500
