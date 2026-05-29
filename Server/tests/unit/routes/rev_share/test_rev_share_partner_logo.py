"""Tests for POST /api/v1/admin/partners/<id>/logo."""

from io import BytesIO
from unittest.mock import Mock, patch

from flask import Flask

from app import db
from app.models import Partner, User


def _admin_user(db_session):
    user = User(email="admin-logo@test.com", name="Admin", is_agent=False)
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


def test_upload_partner_logo_success(client, app: Flask, db_session):
    with app.app_context():
        user = _admin_user(db_session)
        partner = _partner(db_session)
        partner_id = partner.id

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.rev_share.handlers.admin_partners.user_has_admin_role",
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
        assert data["data"]["logo_key"] == "integration-logos/logo-partner/logo.png"

        stored = Partner.query.filter_by(id=partner_id).first()
        assert stored.logo_url == "integration-logos/logo-partner/logo.png"


def test_upload_partner_logo_validation_error_returns_message(client, app: Flask, db_session):
    with app.app_context():
        from app.utils.security.file_security import FileSecurityError

        user = _admin_user(db_session)
        partner = _partner(db_session)

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.rev_share.handlers.admin_partners.user_has_admin_role",
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
        assert "heic" in (data.get("message") or "").lower()


def test_upload_partner_logo_no_file(client, app: Flask, db_session):
    with app.app_context():
        user = _admin_user(db_session)
        partner = _partner(db_session)

        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.rev_share.handlers.admin_partners.user_has_admin_role",
                return_value=True,
            ):
                response = client.post(
                    f"/api/v1/admin/partners/{partner.id}/logo",
                    headers={"Authorization": "Bearer mock_token"},
                )

        assert response.status_code == 400


def test_update_partner_ignores_presigned_logo_url_in_payload(app, db_session):
    from app.services.rev_share.admin.partners_admin import update_partner

    with app.app_context():
        partner = _partner(db_session)
        partner.logo_url = "integration-logos/logo-partner/logo.png"
        db.session.commit()

        row, err = update_partner(
            partner.id,
            {"logo_url": "https://signed.example/expired.png", "name": "Renamed"},
        )
        assert err is None
        assert row is not None

        refreshed = Partner.query.filter_by(id=partner.id).first()
        assert refreshed.name == "Renamed"
        assert refreshed.logo_url == "integration-logos/logo-partner/logo.png"
