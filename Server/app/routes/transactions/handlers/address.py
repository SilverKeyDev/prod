"""Transaction property address routes."""

from flask import jsonify

from app.schemas import TransactionAddressData, TransactionAddressResponse
from app.services.transactions.address import get_active_buyer_address, save_transaction_address
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response

from .. import transactions_bp


@transactions_bp.route("/address", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_transaction_address(user):
    data = get_active_buyer_address(buyer_id=str(user.id))
    if data.get("address") is None:
        return jsonify({"success": True, "data": {"address": None}})
    return jsonify({"success": True, "data": data})


@transactions_bp.route("/address", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(TransactionAddressData)
@validate_response(TransactionAddressResponse)
def save_transaction_address_route(user, data: TransactionAddressData):
    try:
        request_data = data.model_dump()
        address = request_data.get("address")
        if not address or not isinstance(address, str):
            return validation(
                "address is required",
                field_errors={"address": "Required"},
            )
        address = str(address).strip()
        if not address:
            return validation(
                "address cannot be empty",
                field_errors={"address": "Cannot be empty"},
            )

        payload, transaction_id = save_transaction_address(
            buyer_id=str(user.id),
            user_id=str(user.id),
            address=address,
            street=request_data.get("street")
            if isinstance(request_data.get("street"), str)
            else None,
            city=request_data.get("city") if isinstance(request_data.get("city"), str) else None,
            state=request_data.get("state") if isinstance(request_data.get("state"), str) else None,
            postal_code=request_data.get("postal_code")
            if isinstance(request_data.get("postal_code"), str)
            else None,
            country=request_data.get("country")
            if isinstance(request_data.get("country"), str)
            else None,
            place_id=request_data.get("place_id")
            if isinstance(request_data.get("place_id"), str)
            else None,
        )

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "transaction_address_saved",
            properties={
                "has_place_id": bool(payload.get("place_id")),
                "transaction_id": transaction_id,
            },
        )

        return jsonify({"success": True, "data": payload})
    except Exception as e:
        return server_error(e, context={"function": "save_transaction_address"})
