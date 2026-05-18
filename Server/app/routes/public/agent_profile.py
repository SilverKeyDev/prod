"""Public agent profile route."""

from flask import jsonify

from app.schemas.generated import PublicAgentProfileResponse, Success
from app.services.public_agent_profile import build_public_agent_profile
from app.services.public_profile_slug import lookup_agent_user_id_by_public_slug
from app.utils.http.cache import apply_edge_cache
from app.utils.security import rate_limit
from app.utils.validation import validate_response

from . import public_bp


@public_bp.route("/agent-profile/slug/<public_profile_slug>", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@validate_response(PublicAgentProfileResponse)
def get_public_agent_profile_by_slug(public_profile_slug: str):
    """Public agent profile by ``users.public_profile_slug`` (used by short ``/a/{slug}`` links)."""
    user_id = lookup_agent_user_id_by_public_slug(public_profile_slug.strip().lower())
    if user_id is None:
        return jsonify({"success": False, "error": "not_found", "message": None}), 404
    agent = build_public_agent_profile(user_id)
    if agent is None:
        return jsonify({"success": False, "error": "not_found", "message": None}), 404
    payload = PublicAgentProfileResponse(
        success=Success.boolean_True,
        message=None,
        error=None,
        agent=agent,
    )
    out = jsonify(payload.model_dump(mode="json"))
    apply_edge_cache(out, max_age=120, stale_while_revalidate=300)
    return out


@public_bp.route("/agent-profile/<user_id>", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@validate_response(PublicAgentProfileResponse)
def get_public_agent_profile(user_id: str):
    """Return a public agent profile for shareable URLs, or 404.

    The SPA route is ``/agent-profile/{name_slug}/{user_id}``; this JSON API is keyed by ``user_id`` only.
    """
    agent = build_public_agent_profile(user_id)
    if agent is None:
        return jsonify({"success": False, "error": "not_found", "message": None}), 404
    payload = PublicAgentProfileResponse(
        success=Success.boolean_True,
        message=None,
        error=None,
        agent=agent,
    )
    out = jsonify(payload.model_dump(mode="json"))
    # Short public cache: profile changes are infrequent; SWR allows CDNs to serve stale while revalidating.
    apply_edge_cache(out, max_age=120, stale_while_revalidate=300)
    return out
