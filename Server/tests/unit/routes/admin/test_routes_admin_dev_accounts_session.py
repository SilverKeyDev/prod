"""Admin dev-account session route tests."""

from __future__ import annotations

from app import db
from app.models import User, UserRole

_MINT_URL = "/api/v1/admin/dev-accounts/session"
_EXCHANGE_URL = "/api/v1/admin/dev-accounts/session/exchange"


def _user(email: str, role: str) -> User:
    user = User(email=email, name=email.split("@", 1)[0], cognito_id=f"cognito-{email}")
    db.session.add(user)
    db.session.flush()
    db.session.add(UserRole(user_id=user.id, role=role))
    db.session.commit()
    return user


def test_admin_mints_dev_session_and_seeds_all_role_accounts(client, db_session, monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "development")
    admin = _user("admin@example.test", "admin")

    with monkeypatch.context() as m:
        m.setattr("app.services.auth.get_current_user", lambda: admin)
        response = client.post(
            _MINT_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={"workspace": "buyer"},
        )

    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    assert body["token"]
    assert body["role"] == "buyer"
    assert body["user"]["email"] == "dev+admin-buyer@dev.usesilverkey.com"

    test_accounts = (
        db_session.session.query(User)
        .join(UserRole, UserRole.user_id == User.id)
        .filter(UserRole.role == "dev_test_account")
        .all()
    )
    assert {u.email for u in test_accounts} == {
        "dev+admin-buyer@dev.usesilverkey.com",
        "dev+admin-seller@dev.usesilverkey.com",
        "dev+admin-agent@dev.usesilverkey.com",
        "dev+admin-brokerage@dev.usesilverkey.com",
        "dev+admin-integration_partner@dev.usesilverkey.com",
    }


def test_non_admin_cannot_mint_dev_session(client, monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "development")
    user = _user("manager@example.test", "manager")

    with monkeypatch.context() as m:
        m.setattr("app.services.auth.get_current_user", lambda: user)
        response = client.post(
            _MINT_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={"workspace": "buyer"},
        )

    assert response.status_code == 403


def test_dev_session_mint_disabled_in_production(client, monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    admin = _user("prod-admin@example.test", "admin")

    with monkeypatch.context() as m:
        m.setattr("app.services.auth.get_current_user", lambda: admin)
        response = client.post(
            _MINT_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={"workspace": "buyer"},
        )

    assert response.status_code == 403
    assert response.get_json()["error"] == "dev_sessions_disabled"


def test_dev_session_exchange_is_single_use(client, monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "development")
    admin = _user("reuse-admin@example.test", "admin")

    with monkeypatch.context() as m:
        m.setattr("app.services.auth.get_current_user", lambda: admin)
        mint = client.post(
            _MINT_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={"workspace": "agent"},
        )

    token = mint.get_json()["token"]

    first = client.post(_EXCHANGE_URL, json={"token": token})
    assert first.status_code == 200
    first_body = first.get_json()
    assert first_body["success"] is True
    assert first_body["access_token"]
    assert first_body["user"]["email"] == "dev+reuse-admin-agent@dev.usesilverkey.com"

    second = client.post(_EXCHANGE_URL, json={"token": token})
    assert second.status_code == 403
    assert second.get_json()["error"] == "token_used"


def test_dev_session_exchange_disabled_in_production(client, monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")

    response = client.post(_EXCHANGE_URL, json={"token": "anything"})

    assert response.status_code == 403
    assert response.get_json()["error"] == "dev_sessions_disabled"
