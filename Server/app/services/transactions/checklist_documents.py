"""Checklist-linked agreements and document links."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.dtos.documents import AgreementDTO
from app.models import Agreement, AgreementLink, Document, Transaction
from app.services.transactions.persistence import persist_transaction_session
from app.utils.db.orm_lookup import get_model


def _get_agent_id_for_transaction(transaction: Transaction, current_user_id: str) -> str:
    if transaction.primary_agent_id:
        return str(transaction.primary_agent_id)
    return str(current_user_id)


def get_checklist_item_agreements(
    transaction_id: str,
    section: str,
    item_id_int: int,
) -> list[Agreement]:
    linked_item_id = f"{section}.{item_id_int}"
    links = db.session.scalars(
        select(AgreementLink).where(
            AgreementLink.transaction_id == transaction_id,
            AgreementLink.linked_item_type == "checklist_item",
            AgreementLink.linked_item_id == linked_item_id,
        )
    ).all()
    return [link.agreement for link in links if link.agreement]


def link_agreement_to_checklist_item(
    *,
    transaction: Transaction,
    section: str,
    item_id_int: int,
    agreement_id: str | None = None,
    document_id: str | None = None,
    actor_user_id: str,
) -> dict:
    if document_id:
        document = get_model(Document, document_id)
        if not document:
            raise LookupError("document_not_found")

        agent_id = _get_agent_id_for_transaction(transaction, actor_user_id)
        buyer_id = str(transaction.buyer_id)

        agreement = Agreement(
            title=document.filename,
            transaction_id=transaction.id,
            agent_id=agent_id,
            buyer_id=buyer_id,
            agreement_type="uploaded_document",
            signed_document_path=document.file_path,
        )
        db.session.add(agreement)
        db.session.flush()
        resolved_agreement_id = agreement.id
    elif agreement_id:
        agreement = get_model(Agreement, agreement_id)
        if not agreement:
            raise LookupError("agreement_not_found")
        resolved_agreement_id = agreement_id
    else:
        raise ValueError("agreement_id or document_id required")

    linked_item_id = f"{section}.{item_id_int}"
    existing = db.session.scalar(
        select(AgreementLink).where(
            AgreementLink.transaction_id == transaction.id,
            AgreementLink.agreement_id == resolved_agreement_id,
            AgreementLink.linked_item_type == "checklist_item",
            AgreementLink.linked_item_id == linked_item_id,
        )
    )

    if not existing:
        link = AgreementLink(
            transaction_id=transaction.id,
            agreement_id=resolved_agreement_id,
            linked_item_type="checklist_item",
            linked_item_id=linked_item_id,
        )
        db.session.add(link)
        persist_transaction_session()

    agreement = get_model(Agreement, resolved_agreement_id)
    assert agreement is not None
    return AgreementDTO.from_orm(agreement).model_dump(mode="json")
