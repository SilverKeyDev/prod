"""Checklist-linked agreements and documents (non–e-sign provider)."""

from flask import jsonify
from sqlalchemy import select

from app import db
from app.dtos.agreement import AgreementDTO
from app.models import Agreement, AgreementLink, Document, Transaction
from app.schemas import LinkChecklistDocumentApiResponse, LinkDocumentToChecklistRequest
from app.services.transactions.access import can_access_transaction
from app.services.transactions.lookup import get_transaction_by_id
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.db.orm_lookup import get_model
from app.utils.route.http_errors import forbidden, invalid_request, not_found
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


def _resolve_authorized_transaction(user, transaction_id: str) -> Transaction | None:
    tx = get_transaction_by_id(str(transaction_id))
    if tx is None or not can_access_transaction(user, tx):
        return None
    return tx


def _get_agent_id_for_transaction(transaction: Transaction, current_user_id: str) -> str:
    if transaction.primary_agent_id:
        return str(transaction.primary_agent_id)
    return str(current_user_id)


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_checklist_item_documents(user, transaction_id: str, section: str, item_id: str):
    tx = _resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    linked_item_id = f"{section}.{item_id_int}"
    links = db.session.scalars(
        select(AgreementLink).where(
            AgreementLink.transaction_id == tx.id,
            AgreementLink.linked_item_type == "checklist_item",
            AgreementLink.linked_item_id == linked_item_id,
        )
    ).all()

    agreements = [link.agreement for link in links if link.agreement]
    return jsonify(
        {
            "success": True,
            "data": {
                "agreements": [AgreementDTO.from_orm(a).model_dump(mode="json") for a in agreements]
            },
        }
    )


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(LinkDocumentToChecklistRequest)
@validate_response(LinkChecklistDocumentApiResponse)
def link_agreement_to_checklist_item(
    user,
    transaction_id: str,
    section: str,
    item_id: str,
    data: LinkDocumentToChecklistRequest,
):
    tx = _resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    request_data = data.model_dump()

    agreement_id = request_data.get("agreement_id")
    document_id = request_data.get("document_id")

    if document_id:
        document = get_model(Document, document_id)
        if not document:
            return not_found()

        agent_id = _get_agent_id_for_transaction(tx, str(user.id))
        buyer_id = str(tx.buyer_id)

        agreement = Agreement(
            title=document.filename,
            transaction_id=tx.id,
            agent_id=agent_id,
            buyer_id=buyer_id,
            agreement_type="uploaded_document",
            signed_document_path=document.file_path,
        )
        db.session.add(agreement)
        db.session.flush()
        agreement_id = agreement.id
    elif agreement_id:
        agreement = get_model(Agreement, agreement_id)
        if not agreement:
            return not_found()
    else:
        return invalid_request("agreement_id or document_id required")

    linked_item_id = f"{section}.{item_id_int}"
    existing = db.session.scalar(
        select(AgreementLink).where(
            AgreementLink.transaction_id == tx.id,
            AgreementLink.agreement_id == agreement_id,
            AgreementLink.linked_item_type == "checklist_item",
            AgreementLink.linked_item_id == linked_item_id,
        )
    )

    if existing:
        return jsonify(
            {
                "success": True,
                "data": {"agreement": AgreementDTO.from_orm(agreement).model_dump(mode="json")},
            }
        )

    link = AgreementLink(
        transaction_id=tx.id,
        agreement_id=agreement_id,
        linked_item_type="checklist_item",
        linked_item_id=linked_item_id,
    )
    db.session.add(link)
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "data": {"agreement": AgreementDTO.from_orm(agreement).model_dump(mode="json")},
        }
    )
