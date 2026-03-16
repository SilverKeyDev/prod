"""SkySlope integration handlers for transactions."""

from flask import jsonify, request

from app import db
from app.models import Agreement, AgreementLink, Transaction
from app.services.skyslope.api_client import SkySlopeApiClient, SkySlopeApiError
from app.services.skyslope.form_ranker import rank_forms_for_step
from app.services.skyslope.token_store import refresh_if_needed
from app.services.transactions import get_checklist_definition
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.security import rate_limit
from logger import LOG_CATEGORIES, log


def _get_agent_id_for_transaction(transaction: Transaction | None, current_user_id: str) -> str:
    """Resolve agent ID from transaction or current user."""
    if transaction and transaction.primary_agent_id:
        return str(transaction.primary_agent_id)
    return str(current_user_id)


def _get_or_create_transaction(transaction_id: str, user_id: str) -> Transaction | None:
    """Get transaction by ID or return None if not found."""
    return Transaction.query.get(transaction_id)


def _get_checklist_item(section: str, item_id: int) -> dict | None:
    """Get checklist item by section and item id."""
    items = get_checklist_definition(section)
    for item in items:
        if item.get("id") == item_id:
            return item
    return None


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_skyslope_forms(user, transaction_id: str):
    """GET /api/v1/transactions/<tid>/skyslope/forms?suggested_for=escrow.2"""
    suggested_for = request.args.get("suggested_for", "")
    if not suggested_for or "." not in suggested_for:
        return jsonify({"success": False, "error": "suggested_for required (e.g. escrow.2)"}), 400

    section, item_id_str = suggested_for.split(".", 1)
    try:
        item_id = int(item_id_str)
    except ValueError:
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    transaction = _get_or_create_transaction(transaction_id, str(user.id))
    agent_id = _get_agent_id_for_transaction(transaction, str(user.id))

    try:
        tokens = refresh_if_needed(agent_id)
    except ValueError as e:
        if "not connected" in str(e).lower():
            return jsonify({"success": False, "error": "skyslope_not_connected"}), 401
        raise

    item = _get_checklist_item(section, item_id)
    suggested_form_ids = (item or {}).get("suggested_form_ids") or []

    client = SkySlopeApiClient(tokens["access_token"])
    try:
        libraries = client.get_libraries()
        library_ids = [lib["id"] for lib in libraries] if libraries else None
        forms_data = client.get_forms(library_ids=library_ids, page_size=50)
        forms = forms_data.get("forms", [])
    except SkySlopeApiError as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "SkySlope API error fetching forms",
            {"status": e.status_code, "error": str(e)},
        )
        return jsonify({"success": False, "error": "SkySlope temporarily unavailable"}), 502

    ranked = rank_forms_for_step(forms, suggested_form_ids)
    return jsonify(
        {
            "success": True,
            "data": {
                "suggested": ranked["suggested"],
                "other": ranked["other"],
            },
        }
    )


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def attach_skyslope_forms(user, transaction_id: str):
    """POST /api/v1/transactions/<tid>/skyslope/attach"""
    data = request.get_json(force=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Expected JSON object"}), 400

    form_ids = data.get("form_ids")
    section = data.get("checklist_section")
    item_id = data.get("checklist_item_id")

    if not form_ids or not isinstance(form_ids, list):
        return jsonify({"success": False, "error": "form_ids required (array)"}), 400
    if not section or not isinstance(section, str):
        return jsonify({"success": False, "error": "checklist_section required"}), 400
    if item_id is None:
        return jsonify({"success": False, "error": "checklist_item_id required"}), 400

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid checklist_item_id"}), 400

    transaction = _get_or_create_transaction(transaction_id, str(user.id))
    agent_id = _get_agent_id_for_transaction(transaction, str(user.id))

    try:
        tokens = refresh_if_needed(agent_id)
    except ValueError as e:
        if "not connected" in str(e).lower():
            return jsonify({"success": False, "error": "skyslope_not_connected"}), 401
        raise

    client = SkySlopeApiClient(tokens["access_token"])
    form_ids_int = [int(f) for f in form_ids]

    if not transaction:
        transaction = Transaction(
            id=transaction_id,
            primary_agent_id=agent_id,
            buyer_id=str(user.id),
        )
        db.session.add(transaction)
        db.session.flush()

    file_id = transaction.skyslope_file_id
    if not file_id:
        property_data = {
            "streetNumber": "",
            "streetName": "",
            "city": "",
            "state": "",
            "postalCode": "",
        }
        try:
            file_resp = client.create_file(
                name=f"Transaction {transaction_id[:8]}",
                representation_type="Buyer",
                property_data=property_data,
            )
            file_id = file_resp.get("fileId")
        except SkySlopeApiError as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "SkySlope create file failed",
                {"error": str(e)},
            )
            return jsonify({"success": False, "error": "Failed to create SkySlope file"}), 502

        transaction.skyslope_file_id = file_id
        db.session.commit()

    try:
        client.add_documents_to_file(file_id, form_ids_int)
    except SkySlopeApiError as e:
        if e.status_code == 404:
            return jsonify({"success": False, "error": "Form no longer available"}), 404
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "SkySlope add documents failed",
            {"error": str(e)},
        )
        return jsonify({"success": False, "error": "Failed to add forms"}), 502

    linked_item_id = f"{section}.{item_id_int}"
    documents = client.get_file_documents(file_id)
    form_id_to_doc = {d.get("formId") or d.get("formVersionId"): d for d in documents}

    created = []
    for fid in form_ids_int:
        doc = form_id_to_doc.get(fid)
        name = (doc.get("formName") or f"Form {fid}") if doc else f"Form {fid}"
        agreement = Agreement(
            title=name,
            agent_id=agent_id,
            buyer_id=str(user.id),
            transaction_id=transaction_id,
            skyslope_form_id=fid,
            agreement_type="skyslope_form",
        )
        db.session.add(agreement)
        db.session.flush()
        link = AgreementLink(
            transaction_id=transaction_id,
            agreement_id=agreement.id,
            linked_item_type="checklist_item",
            linked_item_id=linked_item_id,
        )
        db.session.add(link)
        created.append(agreement)

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "data": {"agreements": [a.to_dict() for a in created]},
        }
    )


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_checklist_item_documents(user, transaction_id: str, section: str, item_id: str):
    """GET /api/v1/transactions/<tid>/checklist-items/<section>/<item_id>/documents"""
    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    linked_item_id = f"{section}.{item_id_int}"
    links = AgreementLink.query.filter_by(
        transaction_id=transaction_id,
        linked_item_type="checklist_item",
        linked_item_id=linked_item_id,
    ).all()

    agreements = [link.agreement for link in links if link.agreement]
    return jsonify(
        {
            "success": True,
            "data": {"agreements": [a.to_dict() for a in agreements]},
        }
    )


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def link_agreement_to_checklist_item(user, transaction_id: str, section: str, item_id: str):
    """POST /api/v1/transactions/<tid>/checklist-items/<section>/<item_id>/documents"""
    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    data = request.get_json(force=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Expected JSON object"}), 400

    agreement_id = data.get("agreement_id")
    if not agreement_id:
        return jsonify({"success": False, "error": "agreement_id required"}), 400

    agreement = Agreement.query.get(agreement_id)
    if not agreement:
        return jsonify({"success": False, "error": "Agreement not found"}), 404

    linked_item_id = f"{section}.{item_id_int}"
    existing = AgreementLink.query.filter_by(
        transaction_id=transaction_id,
        agreement_id=agreement_id,
        linked_item_type="checklist_item",
        linked_item_id=linked_item_id,
    ).first()

    if existing:
        return jsonify({"success": True, "data": {"agreement": agreement.to_dict()}})

    link = AgreementLink(
        transaction_id=transaction_id,
        agreement_id=agreement_id,
        linked_item_type="checklist_item",
        linked_item_id=linked_item_id,
    )
    db.session.add(link)
    db.session.commit()

    return jsonify({"success": True, "data": {"agreement": agreement.to_dict()}})
