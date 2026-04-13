"""Shared document-library row shaping for report routes."""

from sqlalchemy.orm import selectinload

from ...models import Agreement, Document, DocumentLibraryItem


def agreement_to_library_row(ag: Agreement) -> dict:
    """Shape an Agreement ORM row like a document-library item (DocuSign tab)."""
    participants_list = [
        {
            "user_id": p.user_id,
            "email": p.email,
            "name": p.name,
            "role": p.role,
            "routing_order": p.routing_order,
            "recipient_status": p.recipient_status,
        }
        for p in (ag.participants or [])
    ]
    return {
        "document_record_kind": "library",
        "library_item_id": ag.library_item_id,
        "library_kind": "agreement",
        "id": ag.id,
        "filename": ag.title,
        "file_path": ag.signed_document_path or "",
        "status": ag.status,
        "created_at": ag.created_at.isoformat() if ag.created_at else None,
        "updated_at": ag.updated_at.isoformat() if ag.updated_at else None,
        "user_id": ag.buyer_id,
        "document_type": "agreement",
        "address": ag.property_address,
        "agreement_type": ag.agreement_type,
        "event_type": None,
        "agent_id": ag.agent_id,
        "buyer_id": ag.buyer_id,
        "participants": participants_list,
    }


def document_library_rows_for_user(target_uid: str) -> list[dict]:
    """Unified list: file uploads and DocuSign agreements for Saved / documents."""
    items = (
        DocumentLibraryItem.query.filter_by(user_id=target_uid)
        .order_by(DocumentLibraryItem.updated_at.desc().nulls_last())
        .all()
    )

    if not items:
        return []

    # Separate items by kind and collect IDs
    upload_item_ids = [item.id for item in items if item.kind == "upload"]
    agreement_item_ids = [item.id for item in items if item.kind == "agreement"]

    # Batch load all documents and agreements
    documents = (
        Document.query.filter(Document.library_item_id.in_(upload_item_ids)).all()
        if upload_item_ids
        else []
    )
    agreements = (
        Agreement.query.filter(Agreement.library_item_id.in_(agreement_item_ids)).all()
        if agreement_item_ids
        else []
    )

    # Create lookup dictionaries
    docs_by_item_id = {doc.library_item_id: doc for doc in documents}
    agreements_by_item_id = {ag.library_item_id: ag for ag in agreements}

    rows: list[dict] = []
    for item in items:
        if item.kind == "upload":
            doc = docs_by_item_id.get(item.id)
            if not doc:
                continue
            rows.append(
                {
                    "document_record_kind": "library",
                    "library_item_id": item.id,
                    "library_kind": "upload",
                    "id": doc.id,
                    "filename": doc.filename,
                    "file_path": doc.file_path,
                    "status": doc.status,
                    "created_at": doc.created_at.isoformat() if doc.created_at else None,
                    "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
                    "user_id": doc.user_id,
                    "document_type": getattr(doc, "document_type", None),
                    "address": getattr(doc, "address", None),
                    "event_type": None,
                }
            )
        elif item.kind == "agreement":
            ag = agreements_by_item_id.get(item.id)
            if not ag or ag.status in ("voided", "declined"):
                continue
            rows.append(agreement_to_library_row(ag))
    rows.sort(
        key=lambda r: (
            r.get("updated_at") or r.get("created_at") or "",
            r.get("id") or "",
        ),
        reverse=True,
    )
    return rows


def document_library_rows_for_agent_request(target_uid: str, acting_user) -> list[dict]:
    """
    Rows for the scoped user. When an agent scopes to their own id (no client_id),
    include agreements they represent as agent even though library items are stored
    under the buyer's user_id.
    """
    rows = document_library_rows_for_user(target_uid)
    if not getattr(acting_user, "is_agent", False):
        return rows
    if str(acting_user.id) != str(target_uid):
        return rows

    seen_agreement_ids = {r["id"] for r in rows if r.get("library_kind") == "agreement"}
    extra = (
        Agreement.query.options(selectinload(Agreement.participants))
        .filter(Agreement.agent_id == acting_user.id)
        .order_by(Agreement.updated_at.desc().nulls_last())
        .all()
    )
    for ag in extra:
        if (
            ag.id in seen_agreement_ids
            or not ag.library_item_id
            or ag.status in ("voided", "declined")
        ):
            continue
        rows.append(agreement_to_library_row(ag))
        seen_agreement_ids.add(ag.id)

    rows.sort(
        key=lambda r: (
            r.get("updated_at") or r.get("created_at") or "",
            r.get("id") or "",
        ),
        reverse=True,
    )
    return rows
