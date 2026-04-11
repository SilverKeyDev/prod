"""Document ORM → OpenAPI `WorkflowDocumentRecord` (dashboard workflow row)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from app.schemas.generated import Status2
from app.schemas.generated import WorkflowDocumentRecord as WorkflowDocumentRecordSchema

if TYPE_CHECKING:
    from app.models.documents.document import Document as DocumentModel

_DOCUMENT_STATUS_TO_WORKFLOW: dict[str, Status2] = {
    "uploaded": Status2.pending,
    "processing": Status2.pending,
    "processed": Status2.approved,
    "error": Status2.rejected,
}


def _ensure_timezone_aware(dt: datetime | None) -> str | None:
    """Convert naive datetime to timezone-aware UTC datetime ISO string."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


class WorkflowDocumentDTO:
    """
    Builds `WorkflowDocumentRecord` from a `documents` row.

    The ORM does not store category, offer_id, or expiry; callers may override via
    `WorkflowDocumentDTO.from_document(..., overrides={...})` when assembling responses.
    """

    @staticmethod
    def from_document(
        doc: DocumentModel,
        *,
        category: str = "upload",
        file_type: str | None = None,
        overrides: dict[str, Any] | None = None,
    ) -> WorkflowDocumentRecordSchema:
        raw_status = (doc.status or "uploaded").lower()
        wf_status = _DOCUMENT_STATUS_TO_WORKFLOW.get(raw_status, Status2.pending)
        uploaded_at = _ensure_timezone_aware(doc.created_at) or ""
        payload = {
            "document_record_kind": "workflow",
            "id": doc.id,
            "name": doc.filename,
            "file_path": doc.file_path,
            "file_size": int(doc.file_size or 0),
            "file_type": file_type or "application/pdf",
            "category": category,
            "property_id": None,
            "offer_id": None,
            "uploaded_by": doc.user_id,
            "uploaded_at": uploaded_at,
            "is_signed": None,
            "expiry_date": None,
            "status": wf_status,
            "address": doc.address,
            "document_type": doc.document_type,
        }
        if overrides:
            payload.update(overrides)
        return WorkflowDocumentRecordSchema(**payload)
