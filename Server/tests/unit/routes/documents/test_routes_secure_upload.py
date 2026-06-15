"""Route tests for POST /api/v1/upload/document and /image."""

from __future__ import annotations

import uuid
from io import BytesIO
from unittest.mock import Mock, patch

import pytest
from flask import Flask

from app import db
from app.models import User


def _user(db_session) -> User:
    user = User(
        cognito_id=f"cognito-{uuid.uuid4().hex[:8]}",
        email=f"upload-{uuid.uuid4().hex[:8]}@example.com",
        name="Upload User",
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.mark.api
def test_upload_document_no_file_returns_400(client, app: Flask, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        with patch("app.services.auth.get_current_user", return_value=user):
            resp = client.post(
                "/api/v1/upload/document",
                headers={"Authorization": "Bearer mock_token"},
            )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is False
    assert "error_id" in body


@pytest.mark.api
def test_upload_document_empty_filename_returns_400(client, app: Flask, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        with patch("app.services.auth.get_current_user", return_value=user):
            resp = client.post(
                "/api/v1/upload/document",
                data={"file": (BytesIO(b""), "")},
                content_type="multipart/form-data",
                headers={"Authorization": "Bearer mock_token"},
            )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is False


@pytest.mark.api
def test_upload_document_validation_error_returns_secure_response(
    client, app: Flask, db_session
) -> None:
    from app.utils.security.file_security import FileSecurityError

    with app.app_context():
        user = _user(db_session)
        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.documents.secure_upload.validate_file_upload",
                side_effect=FileSecurityError("File type not allowed"),
            ):
                resp = client.post(
                    "/api/v1/upload/document",
                    data={"file": (BytesIO(b"bad"), "evil.exe")},
                    content_type="multipart/form-data",
                    headers={"Authorization": "Bearer mock_token"},
                )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is False
    assert "traceback" not in str(body).lower()
    assert "FileSecurityError" not in str(body)


@pytest.mark.api
def test_upload_document_success_without_s3(client, app: Flask, db_session) -> None:
    from app.models import Document as RealDocument
    from app.services.transactions.ensure import ensure_transaction

    with app.app_context():
        user = _user(db_session)
        tx = ensure_transaction(buyer_id=str(user.id))
        db.session.commit()
        tx_id = tx.id

        def document_with_tx(**kwargs):
            kwargs["transaction_id"] = tx_id
            return RealDocument(**kwargs)

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.documents.secure_upload.validate_file_upload",
                return_value=("notes.txt", "text/plain"),
            ):
                with patch("app.routes.documents.secure_upload.s3_service") as mock_s3:
                    mock_s3.s3_client = None
                    with patch("app.models.Document", side_effect=document_with_tx):
                        resp = client.post(
                            "/api/v1/upload/document",
                            data={"file": (BytesIO(b"hello"), "notes.txt")},
                            content_type="multipart/form-data",
                            headers={"Authorization": "Bearer mock_token"},
                        )
    assert resp.status_code == 201, resp.get_json()
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is True
    assert body["document"]["filename"] == "notes.txt"
    assert body["document"]["type"] == "text/plain"
    assert body["document"]["hash"]


@pytest.mark.api
def test_upload_document_success_with_s3(client, app: Flask, db_session) -> None:
    from app.models import Document as RealDocument
    from app.services.transactions.ensure import ensure_transaction

    with app.app_context():
        user = _user(db_session)
        tx = ensure_transaction(buyer_id=str(user.id))
        db.session.commit()
        tx_id = tx.id

        def document_with_tx(**kwargs):
            kwargs["transaction_id"] = tx_id
            return RealDocument(**kwargs)

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.documents.secure_upload.validate_file_upload",
                return_value=("report.pdf", "application/pdf"),
            ):
                with patch("app.routes.documents.secure_upload.s3_service") as mock_s3:
                    mock_s3.s3_client = Mock()
                    mock_s3.upload_file = Mock(return_value="https://s3.example/report.pdf")
                    with patch("app.models.Document", side_effect=document_with_tx):
                        resp = client.post(
                            "/api/v1/upload/document",
                            data={"file": (BytesIO(b"%PDF"), "report.pdf")},
                            content_type="multipart/form-data",
                            headers={"Authorization": "Bearer mock_token"},
                        )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is True
    mock_s3.upload_file.assert_called_once()
