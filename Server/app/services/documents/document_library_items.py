"""Create and link DocumentLibraryItem rows for uploads and agreements."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app import db

if TYPE_CHECKING:
    from app.models import Agreement, Document


def attach_library_item_to_document(doc: Document) -> None:
    """Ensure a library row exists for this upload (mutates doc.library_item_id)."""
    if doc.library_item_id:
        return
    now = datetime.now(timezone.utc)
    from app.models import DocumentLibraryItem

    item = DocumentLibraryItem(
        id=str(uuid.uuid4()),
        user_id=doc.user_id,
        kind="upload",
        title=(doc.filename or "Document")[:512],
        display_status=(doc.status or "uploaded")[:50],
        created_at=doc.created_at or now,
        updated_at=doc.updated_at or doc.created_at or now,
    )
    db.session.add(item)
    db.session.flush()
    doc.library_item_id = item.id


def attach_library_item_to_agreement(agreement: Agreement) -> None:
    """Ensure a library row exists for this agreement (mutates agreement.library_item_id)."""
    if agreement.library_item_id:
        return
    now = datetime.now(timezone.utc)
    from app.models import DocumentLibraryItem

    item = DocumentLibraryItem(
        id=str(uuid.uuid4()),
        user_id=agreement.buyer_id,
        kind="agreement",
        title=(agreement.title or "Agreement")[:512],
        display_status=(agreement.status or "draft")[:50],
        created_at=agreement.created_at or now,
        updated_at=agreement.updated_at or agreement.created_at or now,
    )
    db.session.add(item)
    db.session.flush()
    agreement.library_item_id = item.id


def sync_agreement_library_item(agreement: Agreement) -> None:
    """Keep library title/status in sync when agreement fields change."""
    if not agreement.library_item_id:
        return
    from app.models import DocumentLibraryItem

    item = DocumentLibraryItem.query.get(agreement.library_item_id)
    if not item:
        return
    item.title = (agreement.title or "Agreement")[:512]
    item.display_status = (agreement.status or "draft")[:50]
    item.updated_at = datetime.now(timezone.utc)
