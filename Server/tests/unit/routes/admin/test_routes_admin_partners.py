"""Tests for admin partner CRUD routes."""

from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy import select

from app import db
from app.models import Partner

_SUPER_ADMIN = SimpleNamespace(
    id="super-1",
    user_roles=[SimpleNamespace(role="super_admin")],
)
_ADMIN = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)
_NON_ADMIN = SimpleNamespace(
    id="user-1",
    user_roles=[SimpleNamespace(role="buyer")],
)


def test_list_partners_requires_super_admin(client, app):
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN):
        resp = client.get(
            "/api/v1/admin/partners",
            headers={"Authorization": "Bearer mock"},
        )
    assert resp.status_code == 403
    assert resp.get_json().get("error") == "super_admin_required"


def test_list_partners_admin_without_super_admin_forbidden(client, app):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        resp = client.get(
            "/api/v1/admin/partners",
            headers={"Authorization": "Bearer mock"},
        )
    assert resp.status_code == 403
    assert resp.get_json().get("error") == "super_admin_required"


def test_create_partner_super_admin(client, app, db_session):
    with patch("app.services.auth.get_current_user", return_value=_SUPER_ADMIN):
        resp = client.post(
            "/api/v1/admin/partners",
            headers={"Authorization": "Bearer mock"},
            json={
                "name": "Test Partner Embed",
                "slug": "test-partner-embed",
                "destination_url_template": "https://partner.example/SilverKey",
                "step_ids": ["closing:13"],
                "target_roles": ["buyer"],
                "payout_type": "on_click",
                "is_active": True,
            },
        )
    assert resp.status_code in (200, 201)
    body = resp.get_json()
    assert body.get("success") is True

    with app.app_context():
        row = db.session.scalar(select(Partner).where(Partner.slug == "test-partner-embed"))
        assert row is not None


def test_delete_partner_admin(client, app, db_session):
    with app.app_context():
        partner = Partner(
            name="Delete Me",
            slug="delete-me-partner",
            destination_url_template="https://example.com",
            step_id="closing:13",
            step_ids=["closing:13"],
            target_roles=["buyer"],
            payout_type="on_click",
            is_active=True,
        )
        db.session.add(partner)
        db.session.commit()
        partner_id = partner.id

    with patch("app.services.auth.get_current_user", return_value=_SUPER_ADMIN):
        resp = client.delete(
            f"/api/v1/admin/partners/{partner_id}",
            headers={"Authorization": "Bearer mock"},
        )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body.get("success") is True

    with app.app_context():
        assert db.session.scalar(select(Partner).where(Partner.id == partner_id)) is None


def test_delete_partner_not_found(client, app):
    with patch("app.services.auth.get_current_user", return_value=_SUPER_ADMIN):
        resp = client.delete(
            "/api/v1/admin/partners/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": "Bearer mock"},
        )
    assert resp.status_code == 404
    body = resp.get_json()
    assert body["error"] == "RESOURCE_NOT_FOUND"
