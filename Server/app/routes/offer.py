from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from app.schemas import NegotiationStrategyRequest, NegotiationStrategyResponse
from app.services.negotiation.strategy_route_service import build_negotiation_strategy_payload
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.validation import validate_request, validate_response

offer_bp = Blueprint("offer", __name__, url_prefix="/api/v1/offer")


@offer_bp.route("/generate-strategy", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(NegotiationStrategyRequest)
@validate_response(NegotiationStrategyResponse)
def generate_negotiation_strategy(user, data: NegotiationStrategyRequest | None = None):
    """Generate a negotiation strategy for a specific property."""
    if data is not None:
        address = data.address
        target_user_id = data.user_id
    else:
        request_data = request.get_json(silent=True)
        if not request_data:
            current_app.logger.error("No JSON data provided in request")
            return jsonify({"error": "No data provided", "success": False}), 400
        address = request_data.get("address")
        target_user_id = request_data.get("user_id")

    if not address:
        current_app.logger.error("No address provided in request data")
        return jsonify({"error": "Address is required", "success": False}), 400

    body, status = build_negotiation_strategy_payload(
        user,
        address=address,
        target_user_id=target_user_id,
    )
    return jsonify(body), status
