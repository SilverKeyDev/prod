"""Transaction-related API (address for Decide on a home step)."""

import uuid

from flask import Blueprint, current_app, jsonify, request

from app.schemas import (
    TaskChecklistApiResponse,
    TransactionAddressData,
    TransactionAddressResponse,
    UpdateTaskChecklistRequest,
)
from app.schemas.generated import ChecklistTypeQueryParams
from app.services.agent.client_service import get_agent_client_ids
from app.services.transactions.checklist_support.checklist_constants import coerce_checklist_type
from app.services.transactions.unified_task_checklist_progress_summary import (
    build_task_checklist_progress_summary,
)
from app.services.transactions.unified_task_checklist_read import (
    TASK_CATEGORIES,
    build_task_checklist_data,
)
from app.services.transactions.unified_task_checklist_write import perform_task_checklist_put
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_request, validate_response

from .. import db
from ..models import TransactionAddress
from ..utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from .checklist_dispatch_automation import (
    get_checklist_dispatch_automation,
    put_checklist_dispatch_automation,
)
from .checklist_documents import get_checklist_item_documents, link_agreement_to_checklist_item
from .checklist_forms import download_form, get_checklist_item_forms, send_form

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/v1/transactions")


def _can_read_transaction_task_checklist(user, transaction_id: str) -> bool:
    if str(user.id) == str(transaction_id):
        return True
    return str(transaction_id) in set(get_agent_client_ids(str(user.id)))


_can_write_transaction_task_checklist = _can_read_transaction_task_checklist


@transactions_bp.route("/<transaction_id>/tasks", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(ChecklistTypeQueryParams)
def get_transaction_task_checklist(
    user, transaction_id: str, query: ChecklistTypeQueryParams | None = None
):
    """GET checklist definitions + checkedIds for a buyer (self) or an agent's client."""
    if not _can_read_transaction_task_checklist(user, str(transaction_id)):
        return jsonify({"success": False, "error": "Access denied"}), 403

    checklist_type = coerce_checklist_type(
        (query.type if query is not None else None) or request.args.get("type")
    )
    data = build_task_checklist_data(
        str(transaction_id),
        checklist_type,
        actor_user_id=str(user.id),
    )
    if data is None:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400

    return jsonify({"success": True, "data": data})


@transactions_bp.route("/<transaction_id>/tasks/progress-summary", methods=["GET"])
@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_transaction_task_checklist_progress_summary(user, transaction_id: str):
    """GET progress summary for a buyer (self) or an agent's managed client."""
    if not _can_read_transaction_task_checklist(user, str(transaction_id)):
        return jsonify({"success": False, "error": "Access denied"}), 403

    data = build_task_checklist_progress_summary(str(transaction_id))
    return jsonify({"success": True, "data": data})


@transactions_bp.route("/<transaction_id>/tasks", methods=["PUT"])
@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(ChecklistTypeQueryParams)
@validate_request(UpdateTaskChecklistRequest)
@validate_response(TaskChecklistApiResponse)
def put_transaction_task_checklist(
    user,
    transaction_id: str,
    data: UpdateTaskChecklistRequest | None = None,
    query: ChecklistTypeQueryParams | None = None,
):
    """PUT checklist progress for buyer self or agent updating a managed client."""
    if not _can_write_transaction_task_checklist(user, str(transaction_id)):
        return jsonify({"success": False, "error": "Access denied"}), 403

    checklist_type = coerce_checklist_type(
        (query.type if query is not None else None) or request.args.get("type")
    )
    if checklist_type not in TASK_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400

    try:
        if data is None:
            request_data = request.get_json(silent=True)
            if not isinstance(request_data, dict):
                return jsonify({"success": False, "error": "Expected JSON object"}), 400
            ids = request_data.get("checkedIds")
        else:
            payload = data.model_dump()
            inner = payload.get("data") or {}
            ids = inner.get("checkedIds")
        if not isinstance(ids, list):
            return jsonify({"success": False, "error": "checkedIds must be an array"}), 400

        coerced = [int(x) for x in ids if isinstance(x, int | float)]
        correlation_id = (request.headers.get("X-Request-ID") or "").strip() or str(uuid.uuid4())
        payload, _merge_diag = perform_task_checklist_put(
            subject_user_id=str(transaction_id),
            checklist_type=checklist_type,
            coerced_ids=coerced,
            actor_user_id=str(user.id),
            correlation_id=correlation_id,
        )

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "checklist_tasks_updated",
            properties={
                "checklist_type": checklist_type,
                "checked_count": len(coerced),
            },
        )

        return jsonify(payload)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        current_app.logger.error("Failed to update transaction %s checklist: %s", transaction_id, e)
        return jsonify({"success": False, "error": "Server error"}), 500


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
@validate_request(TransactionAddressData)
@validate_response(TransactionAddressResponse)
def save_transaction_address(user, data: TransactionAddressData | None = None):
    """POST /api/v1/transactions/address. Saves the user's transaction address.
    Body: { "address": string, "street"?, "city"?, "state"?, "postal_code"?, "country"?, "place_id"? }
    """
    try:
        if data is None:
            request_data = request.get_json(silent=True)
            if not isinstance(request_data, dict):
                return jsonify({"success": False, "error": "Expected JSON object"}), 400
        else:
            request_data = data.model_dump()
        address = request_data.get("address")
        if not address or not isinstance(address, str):
            return jsonify({"success": False, "error": "address is required"}), 400
        address = str(address).strip()
        if not address:
            return jsonify({"success": False, "error": "address cannot be empty"}), 400

        user_id = str(user.id)
        addr = TransactionAddress.query.filter_by(user_id=user_id).first()
        if addr:
            addr.address = address
            addr.street = (
                request_data.get("street") if isinstance(request_data.get("street"), str) else None
            )
            addr.city = (
                request_data.get("city") if isinstance(request_data.get("city"), str) else None
            )
            addr.state = (
                request_data.get("state") if isinstance(request_data.get("state"), str) else None
            )
            addr.postal_code = (
                request_data.get("postal_code")
                if isinstance(request_data.get("postal_code"), str)
                else None
            )
            addr.country = (
                request_data.get("country")
                if isinstance(request_data.get("country"), str)
                else None
            )
            addr.place_id = (
                request_data.get("place_id")
                if isinstance(request_data.get("place_id"), str)
                else None
            )
        else:
            addr = TransactionAddress(
                user_id=user_id,
                address=address,
                street=request_data.get("street")
                if isinstance(request_data.get("street"), str)
                else None,
                city=request_data.get("city")
                if isinstance(request_data.get("city"), str)
                else None,
                state=request_data.get("state")
                if isinstance(request_data.get("state"), str)
                else None,
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
            db.session.add(addr)
        db.session.commit()

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "transaction_address_saved",
            properties={"has_place_id": bool(addr.place_id)},
        )

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


# Checklist documents endpoints (linked agreements for checklist items)
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

# Checklist forms endpoints (embedded in steps, visible to all authenticated users)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/forms",
    "get_checklist_item_forms",
    get_checklist_item_forms,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/forms/<form_id>/download",
    "download_form",
    download_form,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/forms/<form_id>/send",
    "send_form",
    send_form,
    methods=["POST"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/dispatch-automation",
    "get_checklist_dispatch_automation",
    get_checklist_dispatch_automation,
    methods=["GET"],
)
transactions_bp.add_url_rule(
    "/<transaction_id>/checklist-items/<section>/<item_id>/dispatch-automation",
    "put_checklist_dispatch_automation",
    put_checklist_dispatch_automation,
    methods=["PUT"],
)
