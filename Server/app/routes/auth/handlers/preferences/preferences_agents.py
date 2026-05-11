"""Agent list and client-agent assignment handlers."""

import json

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
from app.services.auth import get_current_user
from app.services.auth.tokens import (
    AWS_COGNITO_ISSUER,
)
from app.services.auth.tokens import (
    get_signing_key_for_cognito_rs256 as get_signing_key,
)
from app.utils.security.app_logging import get_logger
from app.utils.validation import validate_response

logger = get_logger()


@validate_response(SearchAgentsResponse)
def get_agents():
    """Get all agents whose names start with the provided search string."""
    try:
        search_term = request.args.get("search", "").strip()
        query = User.query.filter(User.is_agent.is_(True))
        if search_term:
            query = query.filter(User.name.ilike(f"{search_term}%"))
        agents = query.all()
        agent_list = []
        for agent in agents:
            agent_data = {
                "id": agent.id,
                "name": agent.name,
                "email": agent.email,
                "phone": agent.phone,
                "created_at": agent.created_at.isoformat() if agent.created_at else None,
            }
            agent_list.append(agent_data)
        return jsonify({"success": True, "agents": agent_list, "count": len(agent_list)}), 200
    except Exception as e:
        logger.error("Failed to fetch agents: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Failed to fetch agents"}), 500


@validate_response(AddAgentResponse)
def set_as_agent():
    """Add the current user to an agent's client list and set the user's agent_id."""
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
        if current_user.is_agent:
            logger.warning("Agent %s attempted to assign themselves as a client.", current_user.id)
            return jsonify(
                {"success": False, "error": "Agents cannot assign themselves as clients"}
            ), 403
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.error("Agent not found with id: %s", agent_id)
            return jsonify({"success": False, "error": "Agent not found"}), 404
        try:
            client_ids = json.loads(agent.client_ids) if agent.client_ids else []
        except (json.JSONDecodeError, TypeError):
            logger.warning(
                "Invalid client_ids format for agent %s, resetting to empty list", agent_id
            )
            client_ids = []
        if current_user.id in client_ids:
            logger.info("User %s is already assigned to agent %s", current_user.id, agent_id)
            return jsonify(
                {"success": False, "error": "User is already assigned to this agent"}
            ), 409
        client_ids.append(current_user.id)
        agent.client_ids = json.dumps(client_ids)
        try:
            agent_ids = json.loads(current_user.agent_id) if current_user.agent_id else []
        except (json.JSONDecodeError, TypeError):
            logger.warning(
                "Invalid agent_id format for user %s, resetting to empty list", current_user.id
            )
            agent_ids = []
        if agent_id in agent_ids:
            logger.info("Agent %s is already assigned to user %s", agent_id, current_user.id)
            return jsonify(
                {"success": False, "error": "Agent is already assigned to this user"}
            ), 409
        agent_ids.append(agent_id)
        current_user.agent_id = json.dumps(agent_ids)
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "message": f"Successfully assigned agent {agent.name} to user {current_user.name}",
                "agent": {
                    "id": agent.id,
                    "name": agent.name,
                    "email": agent.email,
                    "phone": agent.phone,
                },
            }
        ), 200
    except Exception as e:
        logger.error("Failed to assign agent: %s", str(e), exc_info=True)
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to assign agent"}), 500


@validate_response(UserAgentsResponse)
def get_user_agents():
    """Get all agents assigned to the authenticated user from their agent_id array."""
    try:
        current_user = get_current_user()
        if not current_user:
            logger.error("User not found")
            return jsonify({"success": False, "error": "User not found"}), 404
        try:
            if current_user.agent_id:
                agent_ids = (
                    json.loads(current_user.agent_id)
                    if isinstance(current_user.agent_id, str)
                    else current_user.agent_id
                )
            else:
                agent_ids = []
        except (json.JSONDecodeError, TypeError):
            logger.warning(
                "Invalid agent_id format for user %s, treating as empty", current_user.id
            )
            agent_ids = []
        if not agent_ids:
            return jsonify({"success": True, "agents": [], "count": 0}), 200
        agents = User.query.filter(
            User.id.in_(agent_ids),  # pyright: ignore[reportAttributeAccessIssue]
            User.is_agent.is_(True),
        ).all()
        agent_list = []
        for agent in agents:
            agent_data = {
                "id": agent.id,
                "name": agent.name,
                "email": agent.email,
                "phone": agent.phone,
                "created_at": agent.created_at.isoformat() if agent.created_at else None,
            }
            agent_list.append(agent_data)
        return jsonify({"success": True, "agents": agent_list, "count": len(agent_list)}), 200
    except Exception as e:
        logger.error("Failed to fetch user agents: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Failed to fetch user agents"}), 500


@validate_response(RemoveAgentResponse)
def remove_agent_relationship():
    """Remove the current user from an agent's client list and the agent from the user's agent_id list."""
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
        if current_user.is_agent:
            logger.warning("Agent %s attempted to remove themselves as a client.", current_user.id)
            return jsonify(
                {"success": False, "error": "Agents cannot remove themselves as clients"}
            ), 403
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.error("Agent not found with id: %s", agent_id)
            return jsonify({"success": False, "error": "Agent not found"}), 404
        try:
            client_ids = json.loads(agent.client_ids) if agent.client_ids else []
        except (json.JSONDecodeError, TypeError):
            logger.warning(
                "Invalid client_ids format for agent %s, resetting to empty list", agent_id
            )
            client_ids = []
        if current_user.id not in client_ids:
            logger.info("User %s is not assigned to agent %s", current_user.id, agent_id)
            return jsonify({"success": False, "error": "User is not assigned to this agent"}), 409
        client_ids.remove(current_user.id)
        agent.client_ids = json.dumps(client_ids)
        try:
            agent_ids = json.loads(current_user.agent_id) if current_user.agent_id else []
        except (json.JSONDecodeError, TypeError):
            logger.warning(
                "Invalid agent_id format for user %s, resetting to empty list", current_user.id
            )
            agent_ids = []
        if agent_id not in agent_ids:
            logger.info("Agent %s is not assigned to user %s", agent_id, current_user.id)
            return jsonify({"success": False, "error": "Agent is not assigned to this user"}), 409
        agent_ids.remove(agent_id)
        current_user.agent_id = json.dumps(agent_ids)
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "message": f"Successfully removed agent {agent.name} from user {current_user.name}",
                "agent": {
                    "id": agent.id,
                    "name": agent.name,
                    "email": agent.email,
                    "phone": agent.phone,
                },
            }
        ), 200
    except Exception as e:
        logger.error("Failed to remove agent: %s", str(e), exc_info=True)
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to remove agent"}), 500
