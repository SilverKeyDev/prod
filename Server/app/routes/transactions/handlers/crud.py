"""Core transaction list/create and active-deal routes."""

from flask import jsonify, request

from app.schemas.generated import CreateTransactionRequest, SetActiveTransactionRequest
from app.services.agent.client_service import agent_may_access_client
from app.services.auth.user_role_helpers import user_is_agent
from app.services.transactions.selection import (
    create_transaction_with_commit,
    list_transactions_api_payload,
    list_transactions_for_actor_with_commit,
    resolve_active_transaction_with_commit,
    set_active_transaction_with_commit,
)
from app.services.transactions.serialization import transaction_to_api_dict
from app.utils.common_patterns import (
    forbidden,
    handle_exceptions_with_logging,
    not_found,
    require_authenticated_user,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request

from .. import transactions_bp
from ._helpers import me_transaction_payload


@transactions_bp.route("", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def list_transactions(user):
    buyer_id = (request.args.get("buyer_id") or "").strip() or None
    try:
        rows = list_transactions_for_actor_with_commit(
            str(user.id),
            buyer_id=buyer_id,
            is_agent=user_is_agent(user),
        )
        return jsonify({"success": True, "data": list_transactions_api_payload(rows)})
    except PermissionError:
        return forbidden()
    except ValueError as e:
        return validation(str(e))


@transactions_bp.route("", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(CreateTransactionRequest)
def create_transaction_route(user, data: CreateTransactionRequest):
    is_agent = user_is_agent(user)
    target_buyer = (data.buyer_id or "").strip() if data.buyer_id else str(user.id)
    if is_agent:
        if not data.buyer_id:
            return validation("buyer_id is required when creating a deal as an agent")
        if not agent_may_access_client(str(user.id), target_buyer):
            return forbidden()
    elif str(target_buyer) != str(user.id):
        return forbidden()

    try:
        tx = create_transaction_with_commit(
            buyer_id=target_buyer,
            primary_agent_id=data.primary_agent_id,
            brokerage_org_id=data.brokerage_org_id,
            set_active=data.set_active if data.set_active is not None else True,
            fallback_agent_id=str(user.id) if is_agent else None,
        )
        return jsonify({"success": True, "data": transaction_to_api_dict(tx)}), 201
    except ValueError as e:
        return validation(str(e))


@transactions_bp.route("/me", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_my_transaction(user):
    """GET /api/v1/transactions/me — active deal for the authenticated buyer."""
    tx = resolve_active_transaction_with_commit(buyer_id=str(user.id))
    return jsonify({"success": True, "data": me_transaction_payload(user, tx)})


@transactions_bp.route("/me/active", methods=["PUT"])
@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(SetActiveTransactionRequest)
def set_my_active_transaction(user, data: SetActiveTransactionRequest):
    try:
        tx = set_active_transaction_with_commit(
            buyer_id=str(user.id),
            transaction_id=str(data.transaction_id),
        )
        return jsonify({"success": True, "data": transaction_to_api_dict(tx)})
    except ValueError as e:
        if "not found" in str(e).lower():
            return not_found()
        return validation(str(e))
