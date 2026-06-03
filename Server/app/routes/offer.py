from __future__ import annotations

from flask import Blueprint, jsonify

from app.schemas import NegotiationStrategyRequest, NegotiationStrategyResponse
from app.services.negotiation.strategy_route_service import build_negotiation_strategy_payload
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.route.http_errors import invalid_request
from app.utils.validation import validate_request, validate_response

offer_bp = Blueprint("offer", __name__, url_prefix="/api/v1/offer")


@offer_bp.route("/generate-strategy", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(NegotiationStrategyRequest)
@validate_response(NegotiationStrategyResponse)
def generate_negotiation_strategy(user, data: NegotiationStrategyRequest):
    """Generate a negotiation strategy for a specific property."""
    address = data.address
    target_user_id = data.user_id

    if not address:
        return invalid_request("Address is required")

    body, status = build_negotiation_strategy_payload(
        user,
        address=address,
        target_user_id=target_user_id,
    )
    return jsonify(body), status
