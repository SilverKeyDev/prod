"""Admin logger-config route tests."""

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.routes.admin.handlers.logger_config import ALLOWED_LOGGER_CONFIG_KEYS

_ADMIN_USER = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)
_NON_ADMIN_USER = SimpleNamespace(
    id="user-1",
    user_roles=[SimpleNamespace(role="manager")],
)

_DEFAULT_CONFIG = {
    "polling": True,
    "pages": True,
    "hooks": True,
    "auth": True,
    "http": True,
    "api": True,
    "errors": True,
    "security": True,
    "polygonSearch": False,
    "docusign": True,
    "documents": True,
    "profilePreferences": True,
    "logLevel": "INFO",
}


@pytest.fixture
def mock_logger():
    with patch("app.routes.admin.handlers.logger_config.log") as mock_log:
        mock_log.get_config.return_value = dict(_DEFAULT_CONFIG)
        yield mock_log


def test_get_logger_config_returns_all_allowed_keys(client, mock_logger) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.get(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    config = data["config"]
    for key in ALLOWED_LOGGER_CONFIG_KEYS:
        assert key in config


@pytest.mark.parametrize(
    "config_key,value",
    [
        ("polling", False),
        ("pages", False),
        ("hooks", False),
        ("auth", False),
        ("http", False),
        ("api", False),
        ("errors", False),
        ("security", False),
        ("polygonSearch", True),
        ("docusign", False),
        ("documents", False),
        ("profilePreferences", False),
        ("logLevel", "WARN"),
    ],
)
def test_post_logger_config_updates_each_allowed_key(
    client, mock_logger, config_key: str, value: object
) -> None:
    updated_config = {**_DEFAULT_CONFIG, config_key: value}
    mock_logger.get_config.return_value = updated_config

    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {config_key: value}},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["config"][config_key] == value
    mock_logger.update_config.assert_called_with({config_key: value})


def test_post_logger_config_rejects_unknown_keys(client, mock_logger) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"search": True}},
        )

    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "No valid logger fields" in data.get("error", "")
    mock_logger.update_config.assert_not_called()


def test_get_logger_config_forbidden_for_non_admin(client, mock_logger) -> None:
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN_USER):
        response = client.get(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
        )

    assert response.status_code == 403
    data = response.get_json()
    assert data["success"] is False


def test_post_logger_config_forbidden_for_non_admin(client, mock_logger) -> None:
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"polling": False}},
        )

    assert response.status_code == 403
    data = response.get_json()
    assert data["success"] is False
    mock_logger.update_config.assert_not_called()
