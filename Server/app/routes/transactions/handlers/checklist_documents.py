"""Checklist-linked agreements and documents (non–e-sign provider)."""

from flask import jsonify

from app.dtos.documents import AgreementDTO
from app.schemas import LinkChecklistDocumentApiResponse, LinkDocumentToChecklistRequest
from app.services.transactions.access import resolve_authorized_transaction
from app.services.transactions.checklist_documents import (
    get_checklist_item_agreements,
    link_agreement_to_checklist_item,
)
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.route.http_errors import forbidden, invalid_request, not_found
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_checklist_item_documents(user, transaction_id: str, section: str, item_id: str):
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    agreements = get_checklist_item_agreements(str(tx.id), section, item_id_int)
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
def link_agreement_to_checklist_item_route(
    user,
    transaction_id: str,
    section: str,
    item_id: str,
    data: LinkDocumentToChecklistRequest,
):
    tx = resolve_authorized_transaction(user, transaction_id)
    if tx is None:
        return forbidden()

    try:
        item_id_int = int(item_id)
    except (TypeError, ValueError):
        return invalid_request("Invalid item_id")

    request_data = data.model_dump()
    agreement_id = request_data.get("agreement_id")
    document_id = request_data.get("document_id")

    try:
        agreement_payload = link_agreement_to_checklist_item(
            transaction=tx,
            section=section,
            item_id_int=item_id_int,
            agreement_id=str(agreement_id) if agreement_id else None,
            document_id=str(document_id) if document_id else None,
            actor_user_id=str(user.id),
        )
    except LookupError:
        return not_found()
    except ValueError as e:
        return invalid_request(str(e))

    return jsonify({"success": True, "data": {"agreement": agreement_payload}})
