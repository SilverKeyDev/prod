"""Tests for admin partner CRUD routes."""

from types import SimpleNamespace
from unittest.mock import patch

from app import db
from app.models import Partner

_ADMIN = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)
_NON_ADMIN = SimpleNamespace(
    id="user-1",
    user_roles=[SimpleNamespace(role="buyer")],
)


def test_list_partners_requires_admin(client, app):
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN):
        resp = client.get(
            "/api/v1/admin/partners",
            headers={"Authorization": "Bearer mock"},
        )
    assert resp.status_code == 403


def test_create_partner_admin(client, app, db_session):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        resp = client.post(
            "/api/v1/admin/partners",
            headers={"Authorization": "Bearer mock"},
            json={
                "name": "Move Concierge",
                "slug": "move-concierge-test",
                "destination_url_template": "https://mc.partners/SilverKey",
                "step_ids": ["closing:13"],
                "target_roles": ["buyer"],
                "is_active": True,
            },
        )
    assert resp.status_code in (200, 201)
    body = resp.get_json()
    assert body.get("success") is True

    with app.app_context():
        row = Partner.query.filter_by(slug="move-concierge-test").first()
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

    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        resp = client.delete(
            f"/api/v1/admin/partners/{partner_id}",
            headers={"Authorization": "Bearer mock"},
        )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body.get("success") is True

    with app.app_context():
        assert Partner.query.filter_by(id=partner_id).first() is None


def test_delete_partner_not_found(client, app):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        resp = client.delete(
            "/api/v1/admin/partners/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": "Bearer mock"},
        )
    assert resp.status_code == 404
