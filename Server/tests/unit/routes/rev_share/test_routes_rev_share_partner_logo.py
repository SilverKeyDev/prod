"""Tests for POST /api/v1/admin/partners/<id>/logo (rev-share handler)."""

from io import BytesIO
from unittest.mock import Mock, patch

from flask import Flask
from sqlalchemy import select

from app import db
from app.models import Partner, User

from .conftest import assert_resource_not_found


def _admin_user(db_session):
    user = User(email="admin-logo@test.com", name="Admin")
    db.session.add(user)
    db.session.commit()
    return user


def _partner(db_session):
    partner = Partner(
        name="Logo Partner",
        slug="logo-partner",
        destination_url_template="https://example.com",
        step_id="closing:1",
        step_ids=["closing:1"],
        target_roles=["buyer"],
        is_active=True,
    )
    db.session.add(partner)
    db.session.commit()
    return partner


def test_upload_partner_logo_partner_not_found(client, app: Flask, db_session):
    with app.app_context():
        user = _admin_user(db_session)

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.rev_share.handlers.admin_partners.user_has_super_admin_role",
                return_value=True,
            ):
                response = client.post(
                    "/api/v1/admin/partners/00000000-0000-0000-0000-000000000000/logo",
                    data={"file": (BytesIO(b"png-bytes"), "logo.png")},
                    content_type="multipart/form-data",
                    headers={"Authorization": "Bearer mock_token"},
                )

    assert_resource_not_found(response)


def test_upload_partner_logo_validation_error_does_not_leak_exception(
    client, app: Flask, db_session
):
    with app.app_context():
        from app.utils.security.file_security import FileSecurityError

        user = _admin_user(db_session)
        partner = _partner(db_session)

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.rev_share.handlers.admin_partners.user_has_super_admin_role",
                return_value=True,
            ):
                with patch(
                    "app.utils.security.file_security.validate_file_upload",
                    side_effect=FileSecurityError("File type image/heic not allowed"),
                ):
                    response = client.post(
                        f"/api/v1/admin/partners/{partner.id}/logo",
                        data={"file": (BytesIO(b"heic"), "photo.heic")},
                        content_type="multipart/form-data",
                        headers={"Authorization": "Bearer mock_token"},
                    )

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert data["error"] == "file_upload_error"
        assert "heic" not in (data.get("message") or "").lower()
        assert data.get("error_id")


def test_upload_partner_logo_success(client, app: Flask, db_session):
    with app.app_context():
        user = _admin_user(db_session)
        partner = _partner(db_session)
        partner_id = partner.id

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.rev_share.handlers.admin_partners.user_has_super_admin_role",
                return_value=True,
            ):
                with patch("app.services.documents.s3_service") as mock_s3:
                    mock_s3.s3_client = Mock()
                    mock_s3.upload_file = Mock(
                        return_value="integration-logos/logo-partner/logo.png"
                    )
                    mock_s3.generate_view_url = Mock(return_value="https://signed.example/logo.png")
                    mock_s3.delete_pdf = Mock()

                    with patch(
                        "app.utils.security.file_security.validate_file_upload",
                        return_value=("logo.png", "image/png"),
                    ):
                        response = client.post(
                            f"/api/v1/admin/partners/{partner_id}/logo",
                            data={"file": (BytesIO(b"png-bytes"), "logo.png")},
                            content_type="multipart/form-data",
                            headers={"Authorization": "Bearer mock_token"},
                        )

        assert response.status_code == 201
        data = response.get_json()
        assert data["success"] is True
        assert data["logo_url"] == "https://signed.example/logo.png"

        stored = db.session.scalar(select(Partner).where(Partner.id == partner_id))
        assert stored.logo_url == "integration-logos/logo-partner/logo.png"
