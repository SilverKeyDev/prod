"""Admin reset-dev-user-data route tests."""

from types import SimpleNamespace
from unittest.mock import patch

import pytest

_ADMIN_USER = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)
_SUPER_ADMIN_USER = SimpleNamespace(
    id="super-1",
    user_roles=[SimpleNamespace(role="super_admin")],
)
_NON_ADMIN_USER = SimpleNamespace(
    id="user-1",
    user_roles=[SimpleNamespace(role="manager")],
)

_RESET_URL = "/api/v1/admin/users/reset-dev-data"
_BODY = {"confirm": True, "scopes": ["preferences"]}


@pytest.fixture
def reset_enabled():
    with patch(
        "app.routes.admin.handlers.reset_dev_user_data.dev_user_data_reset_enabled",
        return_value=True,
    ):
        yield


@pytest.fixture
def mock_reset_service():
    with patch(
        "app.routes.admin.handlers.reset_dev_user_data.reset_user_dev_data",
        return_value={"preferences": True},
    ) as mock_fn:
        yield mock_fn


def test_admin_resets_self(client, reset_enabled, mock_reset_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            _RESET_URL,
            headers={"Authorization": "Bearer mock_token"},
            json=_BODY,
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["target_user_id"] == "admin-1"
    assert data["cleared"]["preferences"] is True
    mock_reset_service.assert_called_once_with("admin-1", {"preferences"})


def test_super_admin_resets_other_user(client, reset_enabled, mock_reset_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_SUPER_ADMIN_USER):
        response = client.post(
            _RESET_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={**_BODY, "user_id": "target-uuid"},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["target_user_id"] == "target-uuid"
    mock_reset_service.assert_called_once_with("target-uuid", {"preferences"})


def test_non_admin_forbidden(client, reset_enabled, mock_reset_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN_USER):
        response = client.post(
            _RESET_URL,
            headers={"Authorization": "Bearer mock_token"},
            json=_BODY,
        )

    assert response.status_code == 403
    assert response.get_json()["error"] == "FORBIDDEN"
    mock_reset_service.assert_not_called()


def test_admin_cannot_reset_other_user(client, reset_enabled, mock_reset_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            _RESET_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={**_BODY, "user_id": "other-uuid"},
        )

    assert response.status_code == 403
    assert "Super admin" in response.get_json().get("message", "")
    mock_reset_service.assert_not_called()


def test_empty_scopes_rejected(client, reset_enabled, mock_reset_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            _RESET_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={"confirm": True, "scopes": []},
        )

    assert response.status_code == 400
    mock_reset_service.assert_not_called()


def test_invalid_scope_rejected(client, reset_enabled, mock_reset_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            _RESET_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={"confirm": True, "scopes": ["profile", "invalid"]},
        )

    assert response.status_code == 400
    mock_reset_service.assert_not_called()


def test_transaction_steps_scope_accepted(client, reset_enabled, mock_reset_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            _RESET_URL,
            headers={"Authorization": "Bearer mock_token"},
            json={"confirm": True, "scopes": ["transaction_steps"]},
        )

    assert response.status_code == 200
    mock_reset_service.assert_called_once_with("admin-1", {"transaction_steps"})


def test_user_not_found(client, reset_enabled) -> None:
    with patch(
        "app.routes.admin.handlers.reset_dev_user_data.reset_user_dev_data",
        return_value=None,
    ):
        with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
            response = client.post(
                _RESET_URL,
                headers={"Authorization": "Bearer mock_token"},
                json=_BODY,
            )

    assert response.status_code == 404
    assert response.get_json()["error"] == "RESOURCE_NOT_FOUND"


def test_disabled_in_production_without_flag(client, mock_reset_service) -> None:
    with patch(
        "app.routes.admin.handlers.reset_dev_user_data.dev_user_data_reset_enabled",
        return_value=False,
    ):
        with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
            response = client.post(
                _RESET_URL,
                headers={"Authorization": "Bearer mock_token"},
                json=_BODY,
            )

    assert response.status_code == 503
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "configuration_error"
    assert "error_id" in data
    mock_reset_service.assert_not_called()
