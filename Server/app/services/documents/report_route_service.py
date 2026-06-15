"""Orchestration for /api/v1/report routes (list, presign, inline view, library CRUD)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

import requests
from sqlalchemy import func, select

from app import db
from app.models import Document, DocumentLibraryItem
from app.services.documents import DocumentService, s3_service
from app.services.documents.report_document_library_rows import (
    document_library_rows_for_agent_request,
)
from app.utils.db.orm_lookup import get_model
from app.utils.http.pagination import build_pagination
from logger import log


class ReportServiceError(StrEnum):
    NOT_FOUND = "not_found"
    FORBIDDEN = "forbidden"
    PRESIGN_FAILED = "presign_failed"
    PDF_FETCH_HTTP_FAILED = "pdf_fetch_http_failed"
    PDF_FETCH_S3_FAILED = "pdf_fetch_s3_failed"


@dataclass(frozen=True)
class InlinePdfPayload:
    data: bytes
    filename: str


def _owned_report(user_id: str, report_id: str) -> Document | None:
    report = db.session.scalar(
        select(Document).where(Document.id == report_id, Document.user_id == user_id)
    )
    if not report or not report.file_path:
        return None
    return report


def get_download_url_payload(
    user_id: str, report_id: str
) -> tuple[dict[str, Any] | None, ReportServiceError | None]:
    report = _owned_report(user_id, report_id)
    if not report:
        return None, ReportServiceError.NOT_FOUND

    pdf_url = report.file_path
    if pdf_url.startswith("http"):
        return {"success": True, "downloadUrl": pdf_url}, None

    filename = os.path.basename(pdf_url)
    fresh_url = s3_service.generate_presigned_url(pdf_url, download_filename=filename)
    if not fresh_url:
        return None, ReportServiceError.PRESIGN_FAILED
    return {"success": True, "downloadUrl": fresh_url}, None


def get_view_url_payload(
    user_id: str, report_id: str
) -> tuple[dict[str, Any] | None, ReportServiceError | None]:
    report = _owned_report(user_id, report_id)
    if not report:
        log.info(
            "DOCUMENTS",
            "Report view-url: document not found or missing file",
            {"report_id": report_id, "user_id": user_id},
        )
        return None, ReportServiceError.NOT_FOUND

    storage_kind = "remote_http" if str(report.file_path).startswith("http") else "s3"
    fresh_url = s3_service.generate_view_url(report.file_path)
    if not fresh_url:
        log.warn(
            "DOCUMENTS",
            "Report view-url: failed to generate presigned URL",
            {"report_id": report_id, "user_id": user_id, "storage_kind": storage_kind},
        )
        return None, ReportServiceError.PRESIGN_FAILED

    log.info(
        "DOCUMENTS",
        "Report view-url issued (share/view client)",
        {
            "report_id": report_id,
            "user_id": user_id,
            "storage_kind": storage_kind,
        },
    )
    return {"success": True, "viewUrl": fresh_url}, None


def get_inline_pdf_payload(
    user_id: str, report_id: str
) -> tuple[InlinePdfPayload | None, ReportServiceError | None]:
    report = _owned_report(user_id, report_id)
    if not report:
        return None, ReportServiceError.NOT_FOUND

    pdf_url = report.file_path
    if pdf_url.startswith("http"):
        response = requests.get(pdf_url, timeout=30)
        if response.status_code != 200:
            return None, ReportServiceError.PDF_FETCH_HTTP_FAILED
        pdf_data = response.content
    else:
        pdf_data = s3_service.get_pdf(pdf_url)
        if not pdf_data:
            return None, ReportServiceError.PDF_FETCH_S3_FAILED

    return InlinePdfPayload(data=pdf_data, filename=report.filename), None


def delete_user_report(
    user_id: str, report_id: str, s3_key: str
) -> tuple[dict[str, Any] | None, ReportServiceError | None]:
    normalized_key = (s3_key or "").lstrip("/")

    s3_deleted = False
    if normalized_key:
        deletion_result = DocumentService.delete_report_and_json(normalized_key)
        s3_deleted = deletion_result["pdf_deleted"] or deletion_result["json_deleted"]

    pdf_doc = get_model(Document, report_id)
    if not pdf_doc or pdf_doc.user_id != user_id:
        return None, ReportServiceError.NOT_FOUND

    li_id = pdf_doc.library_item_id
    db.session.delete(pdf_doc)
    if li_id:
        li = get_model(DocumentLibraryItem, li_id)
        if li:
            db.session.delete(li)
    db.session.commit()

    return {
        "success": True,
        "message": "Report deleted successfully",
        "deleted_from_s3": s3_deleted,
        "deleted_from_db": True,
    }, None


def rollback_delete_transaction() -> None:
    db.session.rollback()


def list_pipeline_documents(target_uid: str, limit: int, offset: int) -> dict[str, Any]:
    base_stmt = select(Document).where(Document.user_id == target_uid)
    total_count = db.session.scalar(select(func.count()).select_from(base_stmt.subquery()))
    documents = db.session.scalars(
        base_stmt.order_by(Document.updated_at.desc()).limit(limit).offset(offset)
    ).all()

    documents_data = [
        {
            "document_record_kind": "pipeline",
            "id": doc.id,
            "filename": doc.filename,
            "file_path": doc.file_path,
            "status": doc.status,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
            "user_id": doc.user_id,
            "document_type": getattr(doc, "document_type", None),
            "address": getattr(doc, "address", None),
        }
        for doc in documents
    ]

    return {
        "success": True,
        "documents": documents_data,
        "count": len(documents_data),
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "hasMore": (offset + len(documents_data)) < total_count,
    }


def get_document_library_page(
    target_uid: str, acting_user, page: int, per_page: int
) -> dict[str, Any]:
    rows = document_library_rows_for_agent_request(target_uid, acting_user)
    total = len(rows)
    offset = (page - 1) * per_page
    items = rows[offset : offset + per_page]
    pagination = build_pagination(page=page, per_page=per_page, total=total)
    return {
        "success": True,
        "items": items,
        "count": len(items),
        "pagination": pagination,
    }


def remove_library_item(
    user_id: str, library_item_id: str
) -> tuple[dict[str, Any] | None, ReportServiceError | None]:
    library_item = db.session.scalar(
        select(DocumentLibraryItem).where(DocumentLibraryItem.id == library_item_id)
    )
    if not library_item:
        return None, ReportServiceError.NOT_FOUND
    if library_item.user_id != user_id:
        return None, ReportServiceError.FORBIDDEN

    db.session.delete(library_item)
    db.session.commit()

    log.info(
        "DOCUMENTS",
        "library_item_removed",
        {"library_item_id": library_item_id, "user_id": str(user_id)},
    )
    return {"success": True, "message": "Document removed from library"}, None


def rollback_library_transaction() -> None:
    db.session.rollback()
