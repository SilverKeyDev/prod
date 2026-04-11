"""Checklist-linked agreements and documents (non–e-sign provider)."""

from flask import jsonify, request

from app import db
from app.models import Agreement, AgreementLink, Document, Transaction
from app.schemas import LinkDocumentToChecklistRequest, SuccessResponse
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.security import rate_limit
from app.utils.validation import validate_request, validate_response


def _get_agent_id_for_transaction(transaction: Transaction | None, current_user_id: str) -> str:
    if transaction and transaction.primary_agent_id:
        return str(transaction.primary_agent_id)
    return str(current_user_id)


def _get_or_create_transaction(transaction_id: str) -> Transaction | None:
    return Transaction.query.get(transaction_id)


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
@validate_request(LinkDocumentToChecklistRequest)
@validate_response(SuccessResponse)
def link_agreement_to_checklist_item(
    user,
    transaction_id: str,
    section: str,
    item_id: str,
    data: LinkDocumentToChecklistRequest | None = None,
):
    """POST .../documents — link agreement_id or create from document_id."""
    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid item_id"}), 400

    if data is None:
        request_data = request.get_json(silent=True)
        if not isinstance(request_data, dict):
            return jsonify({"success": False, "error": "Expected JSON object"}), 400
    else:
        request_data = data.model_dump()

    agreement_id = request_data.get("agreement_id")
    document_id = request_data.get("document_id")

    if document_id:
        document = Document.query.get(document_id)
        if not document:
            return jsonify({"success": False, "error": "Document not found"}), 404

        transaction = _get_or_create_transaction(transaction_id)
        agent_id = _get_agent_id_for_transaction(transaction, str(user.id))
        buyer_id = (
            str(transaction.buyer_id) if transaction and transaction.buyer_id else str(user.id)
        )

        agreement = Agreement(
            title=document.filename,
            agent_id=agent_id,
            buyer_id=buyer_id,
            agreement_type="uploaded_document",
            signed_document_path=document.file_path,
        )
        db.session.add(agreement)
        db.session.flush()
        agreement_id = agreement.id
    elif agreement_id:
        agreement = Agreement.query.get(agreement_id)
        if not agreement:
            return jsonify({"success": False, "error": "Agreement not found"}), 404
    else:
        return jsonify({"success": False, "error": "agreement_id or document_id required"}), 400

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
