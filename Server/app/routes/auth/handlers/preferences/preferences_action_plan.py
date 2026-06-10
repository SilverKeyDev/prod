"""Client action plan handler."""

from datetime import datetime

from flask import jsonify
from sqlalchemy import select

from app import db
from app.models import User
from app.schemas import ActionPlanResponse, EmptyRequest
from app.services.agent.client_service import agent_may_access_client
from app.services.aggregation import get_preferences_dict_optional
from app.services.auth.user_role_helpers import user_is_agent
from app.services.chatbot.chatbot_utils import generate_action_plan
from app.utils.common_patterns import (
    external_unavailable,
    handle_exceptions_with_logging,
    not_found,
    require_authenticated_user,
    server_error,
    standardize_error_response,
)
from app.utils.validation import validate_request, validate_response
from logger import log


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
@validate_response(ActionPlanResponse)
def generate_client_action_plan(user, client_id, data: EmptyRequest | None = None):
    """Generate a personalized action plan for a client using OpenAI. Requires agent permissions."""
    try:
        if not user_is_agent(user):
            return standardize_error_response(
                "Agent access required",
                status_code=403,
                error_code="FORBIDDEN",
            )
        client_user = db.session.scalar(select(User).where(User.id == client_id))
        if not client_user:
            return not_found("Client not found")
        if not agent_may_access_client(str(user.id), str(client_id)):
            return standardize_error_response(
                "Client not assigned to this agent",
                status_code=403,
                error_code="FORBIDDEN",
            )
        client_preferences = get_preferences_dict_optional(client_id)
        if not client_preferences:
            return not_found(
                "Client preferences not found. Client needs to complete onboarding first."
            )
        action_plan = generate_action_plan(client_preferences, client_user.name)
        if action_plan.startswith("AI service unavailable") or action_plan.startswith(
            "Unable to generate"
        ):
            return external_unavailable(
                RuntimeError("action_plan_generation_unavailable"),
                api_name="openai",
                context={"function": "generate_client_action_plan", "client_id": str(client_id)},
            )
        return jsonify(
            {
                "success": True,
                "action_plan": action_plan,
                "client_name": client_user.name,
                "generated_at": datetime.now().isoformat(),
            }
        ), 200
    except Exception as e:
        log.error("AUTH", "action_plan_generation_failed", e)
        return server_error(
            e,
            context={"function": "generate_client_action_plan", "client_id": str(client_id)},
        )
