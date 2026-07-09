"""Public agent listings route (current and former MLS listings)."""

from flask import jsonify, request

from app.schemas.generated import PublicAgentListingsResponse, StatusCategory, Success
from app.services.public.agent_listings import build_public_agent_listings
from app.utils.http.cache import apply_edge_cache
from app.utils.route import invalid_request, not_found
from app.utils.security import rate_limit
from app.utils.validation import validate_response

from . import public_bp


@public_bp.route("/agent-profile/<user_id>/listings", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@validate_response(PublicAgentListingsResponse)
def get_public_agent_listings(user_id: str):
    """MLS listings attributed to a public agent, optionally filtered by ``?status=active|sold``."""
    raw_status = (request.args.get("status") or "").strip().lower()
    status: StatusCategory | None = None
    if raw_status:
        try:
            status = StatusCategory(raw_status)
        except ValueError:
            return invalid_request("status must be one of: active, sold")

    listings = build_public_agent_listings(user_id, status)
    if listings is None:
        return not_found()
    payload = PublicAgentListingsResponse(
        success=Success.boolean_True,
        message=None,
        error=None,
        listings=listings,
    )
    out = jsonify(payload.model_dump(mode="json"))
    # Same edge-cache posture as the public profile payload this page loads alongside.
    apply_edge_cache(out, max_age=120, stale_while_revalidate=300)
    return out
