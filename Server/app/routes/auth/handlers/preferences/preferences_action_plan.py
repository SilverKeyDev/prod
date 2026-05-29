"""Client action plan handler."""

from datetime import datetime

from flask import jsonify

from app.models import User
from app.schemas import ActionPlanResponse
from app.services.agent.client_service import agent_may_access_client
from app.services.aggregation import get_preferences_dict_optional
from app.services.chatbot.chatbot_utils import generate_action_plan
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.app_logging import get_logger
from app.utils.validation import validate_response

logger = get_logger()


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(ActionPlanResponse)
def generate_client_action_plan(user, client_id):
    """Generate a personalized action plan for a client using OpenAI. Requires agent permissions."""
    try:
        if not user.is_agent:
            return jsonify({"success": False, "error": "Agent access required"}), 403
        client_user = User.query.filter_by(id=client_id).first()
        if not client_user:
            return jsonify({"success": False, "error": "Client not found"}), 404
        if not agent_may_access_client(str(user.id), str(client_id)):
            return jsonify({"success": False, "error": "Client not assigned to this agent"}), 403
        client_preferences = get_preferences_dict_optional(client_id)
        if not client_preferences:
            return jsonify(
                {
                    "success": False,
                    "error": "Client preferences not found. Client needs to complete onboarding first.",
                }
            ), 404
        action_plan = generate_action_plan(client_preferences, client_user.name)
        if action_plan.startswith("AI service unavailable") or action_plan.startswith(
            "Unable to generate"
        ):
            return jsonify({"success": False, "error": action_plan}), 500
        return jsonify(
            {
                "success": True,
                "action_plan": action_plan,
                "client_name": client_user.name,
                "generated_at": datetime.now().isoformat(),
            }
        ), 200
    except Exception as e:
        logger.error("Failed to generate action plan: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Failed to generate action plan"}), 500
