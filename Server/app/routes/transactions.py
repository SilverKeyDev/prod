"""Transaction-related API (address for Finding a home step)."""

from flask import Blueprint, current_app, jsonify, request

from .. import db
from ..models import TransactionAddress
from ..utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from ..utils.security.security import rate_limit
from .skyslope.transaction_handlers import (
    attach_skyslope_forms,
    get_checklist_item_documents,
    get_skyslope_forms,
    link_agreement_to_checklist_item,
)

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/v1/transactions")


@transactions_bp.route("/address", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_transaction_address(user):
    """GET /api/v1/transactions/address. Returns the user's saved transaction address."""
    addr = (
        TransactionAddress.query.filter_by(user_id=str(user.id))
        .order_by(TransactionAddress.updated_at.desc())
        .first()
    )
    if not addr:
        return jsonify({"success": True, "data": {"address": None}})
    return jsonify(
        {
            "success": True,
            "data": {
                "address": addr.address,
                "street": addr.street,
                "city": addr.city,
                "state": addr.state,
                "postal_code": addr.postal_code,
                "country": addr.country,
                "place_id": addr.place_id,
            },
        }
    )


@transactions_bp.route("/address", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def save_transaction_address(user):
    """POST /api/v1/transactions/address. Saves the user's transaction address.
    Body: { "address": string, "street"?, "city"?, "state"?, "postal_code"?, "country"?, "place_id"? }
    """
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({"success": False, "error": "Expected JSON object"}), 400
        address = data.get("address")
        if not address or not isinstance(address, str):
            return jsonify({"success": False, "error": "address is required"}), 400
        address = str(address).strip()
        if not address:
            return jsonify({"success": False, "error": "address cannot be empty"}), 400

        user_id = str(user.id)
        addr = TransactionAddress.query.filter_by(user_id=user_id).first()
        if addr:
            addr.address = address
            addr.street = data.get("street") if isinstance(data.get("street"), str) else None
            addr.city = data.get("city") if isinstance(data.get("city"), str) else None
            addr.state = data.get("state") if isinstance(data.get("state"), str) else None
            addr.postal_code = (
                data.get("postal_code") if isinstance(data.get("postal_code"), str) else None
            )
            addr.country = data.get("country") if isinstance(data.get("country"), str) else None
            addr.place_id = data.get("place_id") if isinstance(data.get("place_id"), str) else None
        else:
            addr = TransactionAddress(
                user_id=user_id,
                address=address,
                street=data.get("street") if isinstance(data.get("street"), str) else None,
                city=data.get("city") if isinstance(data.get("city"), str) else None,
                state=data.get("state") if isinstance(data.get("state"), str) else None,
                postal_code=data.get("postal_code")
                if isinstance(data.get("postal_code"), str)
                else None,
                country=data.get("country") if isinstance(data.get("country"), str) else None,
                place_id=data.get("place_id") if isinstance(data.get("place_id"), str) else None,
            )
            db.session.add(addr)
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "data": {
                    "address": addr.address,
                    "street": addr.street,
                    "city": addr.city,
                    "state": addr.state,
                    "postal_code": addr.postal_code,
                    "country": addr.country,
                    "place_id": addr.place_id,
                },
            }
        )
    except Exception as e:
        current_app.logger.error("Failed to save transaction address: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


# SkySlope integration routes
transactions_bp.add_url_rule(
    "/<transaction_id>/skyslope/forms",
    view_func=get_skyslope_forms,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/skyslope/attach",
    view_func=attach_skyslope_forms,
    methods=["POST"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/documents",
    "get_checklist_item_documents",
    get_checklist_item_documents,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/documents",
    "link_agreement_to_checklist_item",
    link_agreement_to_checklist_item,
    methods=["POST"],
)
