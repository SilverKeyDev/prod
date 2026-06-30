"""Tests for SIL-270 SkySlope credential admin routes and encryption."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

import pytest
from sqlalchemy import select

from app import db
from app.models.brokerage import BrokerageIntegrationCredential
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.skyslope.encryption import decrypt_credential, encrypt_credential

_ADMIN = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)
_NON_ADMIN = SimpleNamespace(
    id="user-1",
    user_roles=[SimpleNamespace(role="buyer")],
)


@pytest.fixture(autouse=True)
def _mock_skyslope_sync_enqueue():
    """Credential create/sync enqueue must not require Redis in unit tests."""
    with patch(
        "app.routes.admin.handlers.brokerage_skyslope_credentials._enqueue_skyslope_full_sync"
    ) as mock_enqueue:
        yield mock_enqueue


def test_encrypt_decrypt_round_trip():
    plaintext = "sk-test-api-key-12345678"
    ciphertext = encrypt_credential(plaintext)
    assert ciphertext != plaintext
    assert decrypt_credential(ciphertext) == plaintext


def test_create_skyslope_credential_requires_admin(client, app):
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN):
        resp = client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-secret-key-9999"},
        )
    assert resp.status_code == 403


def test_create_and_get_skyslope_credential_metadata(client, app, db_session):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        create_resp = client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-secret-key-9999", "skyslope_org_id": "org-42"},
        )
    assert create_resp.status_code in (200, 201)
    create_body = create_resp.get_json()
    assert create_body.get("success") is True
    data = create_body.get("data") or {}
    assert data.get("key_last4") == "9999"
    assert data.get("provider") == "skyslope"
    assert "api_key" not in data

    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        get_resp = client.get(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
        )
    assert get_resp.status_code == 200
    get_body = get_resp.get_json()
    assert get_body.get("success") is True
    get_data = get_body.get("data") or {}
    assert get_data.get("key_last4") == "9999"
    assert "api_key" not in get_data

    with app.app_context():
        row = db.session.scalar(
            select(BrokerageIntegrationCredential).where(
                BrokerageIntegrationCredential.brokerage_id == DEFAULT_BROKERAGE_ORG_ID
            )
        )
        assert row is not None
        assert decrypt_credential(row.encrypted_payload) == "sk-secret-key-9999"


def test_test_connection_requires_access_secret(client, app, db_session):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-live-key-abcd"},
        )
        test_resp = client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope/test-connection",
            headers={"Authorization": "Bearer mock"},
        )
    assert test_resp.status_code == 200
    body = test_resp.get_json()
    assert body.get("success") is False
    assert "AccessSecret" in body.get("message", "")


@patch("app.services.skyslope.client.SkySlopeClient.test_connection")
def test_test_connection_calls_skyslope(mock_test, client, app, db_session):
    mock_test.return_value = None
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-live-key-abcd", "access_secret": "sk-live-secret"},
        )
        test_resp = client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope/test-connection",
            headers={"Authorization": "Bearer mock"},
        )
    assert test_resp.status_code == 200
    body = test_resp.get_json()
    assert body.get("success") is True
    assert body.get("message") == "SkySlope connection successful."
    mock_test.assert_called_once()


def test_create_duplicate_returns_conflict(client, app, db_session):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-first-key-1111"},
        )
        dup_resp = client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-second-key-2222"},
        )
    assert dup_resp.status_code == 409


def test_delete_skyslope_credential(client, app, db_session):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        client.post(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-delete-me-3333"},
        )
        delete_resp = client.delete(
            f"/api/v1/admin/brokerages/{DEFAULT_BROKERAGE_ORG_ID}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
        )
    assert delete_resp.status_code == 200

    with app.app_context():
        row = db.session.scalar(
            select(BrokerageIntegrationCredential).where(
                BrokerageIntegrationCredential.brokerage_id == DEFAULT_BROKERAGE_ORG_ID
            )
        )
        assert row is None


def test_create_for_unknown_brokerage_returns_not_found(client, app):
    missing_id = "00000000-0000-0000-0000-000000000099"
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        resp = client.post(
            f"/api/v1/admin/brokerages/{missing_id}/integrations/skyslope",
            headers={"Authorization": "Bearer mock"},
            json={"api_key": "sk-unknown-brokerage"},
        )
    assert resp.status_code == 404
