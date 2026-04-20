"""Public agent profile route."""

from flask import jsonify

from app.schemas.generated import PublicAgentProfileResponse, Success
from app.services.public_agent_profile import build_public_agent_profile
from app.utils.security.security import rate_limit
from app.utils.validation import validate_response

from . import public_bp


@public_bp.route("/agent-profile/<user_id>", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@validate_response(PublicAgentProfileResponse)
def get_public_agent_profile(user_id: str):
    """Return a public agent profile for shareable URLs, or 404."""
    agent = build_public_agent_profile(user_id)
    if agent is None:
        return jsonify({"success": False, "error": "not_found", "message": None}), 404
    payload = PublicAgentProfileResponse(
        success=Success.boolean_True,
        message=None,
        error=None,
        agent=agent,
    )
    return jsonify(payload.model_dump(mode="json"))
