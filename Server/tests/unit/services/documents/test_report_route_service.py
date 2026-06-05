"""Unit tests for report route orchestration service."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest

from app import db
from app.models import Document, DocumentLibraryItem, User
from app.services.documents.report_route_service import (
    ReportServiceError,
    delete_user_report,
    get_download_url_payload,
    list_pipeline_documents,
    remove_library_item,
)
from app.services.transactions.ensure import ensure_transaction


def _user(db_session) -> User:
    user = User(
        cognito_id=f"cognito-{uuid.uuid4().hex[:8]}",
        email=f"report-{uuid.uuid4().hex[:8]}@example.com",
        name="Report User",
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


def _document(user: User, *, file_path: str = "reports/user/file.pdf") -> Document:
    tx = ensure_transaction(buyer_id=str(user.id))
    doc_id = str(uuid.uuid4())
    doc = Document(
        id=doc_id,
        user_id=user.id,
        transaction_id=tx.id,
        filename="file.pdf",
        file_path=file_path,
        status="uploaded",
    )
    db.session.add(doc)
    db.session.commit()
    return doc


@pytest.mark.unit
def test_get_download_url_http_path_returns_direct_url(app, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        doc = _document(user, file_path="https://cdn.example.com/report.pdf")
        payload, err = get_download_url_payload(str(user.id), doc.id)
    assert err is None
    assert payload == {"success": True, "downloadUrl": "https://cdn.example.com/report.pdf"}


@pytest.mark.unit
def test_get_download_url_s3_presign(app, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        doc = _document(user, file_path="reports/user/file.pdf")
        with patch(
            "app.services.documents.report_route_service.s3_service.generate_presigned_url",
            return_value="https://s3.example.com/signed",
        ):
            payload, err = get_download_url_payload(str(user.id), doc.id)
    assert err is None
    assert payload == {"success": True, "downloadUrl": "https://s3.example.com/signed"}


@pytest.mark.unit
def test_get_download_url_not_found(app, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        payload, err = get_download_url_payload(str(user.id), "missing-id")
    assert payload is None
    assert err == ReportServiceError.NOT_FOUND


@pytest.mark.unit
def test_list_pipeline_documents_pagination(app, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        _document(user, file_path="reports/a.pdf")
        _document(user, file_path="reports/b.pdf")
        body = list_pipeline_documents(str(user.id), limit=1, offset=0)
    assert body["success"] is True
    assert body["count"] == 1
    assert body["total"] == 2
    assert body["hasMore"] is True


@pytest.mark.unit
def test_remove_library_item_forbidden_for_other_user(app, db_session) -> None:
    with app.app_context():
        owner = _user(db_session)
        other = _user(db_session)
        item = DocumentLibraryItem(
            user_id=owner.id,
            kind="upload",
            title="Doc",
            display_status="uploaded",
        )
        db.session.add(item)
        db.session.commit()
        payload, err = remove_library_item(str(other.id), item.id)
    assert payload is None
    assert err == ReportServiceError.FORBIDDEN


@pytest.mark.unit
def test_delete_user_report_removes_document(app, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        doc = _document(user)
        with patch(
            "app.services.documents.report_route_service.DocumentService.delete_report_and_json",
            return_value={"pdf_deleted": True, "json_deleted": False},
        ):
            payload, err = delete_user_report(str(user.id), doc.id, "reports/user/file.pdf")
        remaining = db.session.get(Document, doc.id)
    assert err is None
    assert payload is not None
    assert payload["deleted_from_db"] is True
    assert remaining is None
