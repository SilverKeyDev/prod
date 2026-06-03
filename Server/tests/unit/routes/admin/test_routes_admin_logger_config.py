"""Admin logger-config route tests."""

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from logger.config.allowed_logger_config_keys_generated import ALLOWED_LOGGER_CONFIG_KEYS

_ADMIN_USER = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)
_NON_ADMIN_USER = SimpleNamespace(
    id="user-1",
    user_roles=[SimpleNamespace(role="manager")],
)

_DEFAULT_SERVER = {
    "polling": True,
    "pages": True,
    "hooks": True,
    "auth": True,
    "http": True,
    "api": True,
    "errors": True,
    "security": True,
    "search": False,
    "polygonSearch": False,
    "mapRendering": False,
    "propertyDetails": False,
    "negotiation": False,
    "checklists": False,
    "calendar": False,
    "dashboard": False,
    "messages": False,
    "feed": False,
    "routing": False,
    "docusign": True,
    "documents": True,
    "profilePreferences": True,
    "logLevel": "INFO",
}

_DEFAULT_CLIENT = {
    "polling": False,
    "pages": False,
    "hooks": False,
    "auth": False,
    "http": False,
    "api": {
        "initialLoad": False,
        "polling": False,
        "pageMount": False,
        "other": False,
    },
    "errors": True,
    "security": True,
    "search": False,
    "polygonSearch": False,
    "mapRendering": False,
    "propertyDetails": False,
    "negotiation": False,
    "checklists": False,
    "calendar": False,
    "dashboard": False,
    "messages": False,
    "feed": False,
    "routing": False,
    "docusign": False,
    "documents": False,
    "profilePreferences": False,
    "logLevel": "ERROR",
}

_DEFAULT_DEPLOYMENT = {"client": _DEFAULT_CLIENT, "server": _DEFAULT_SERVER}


@pytest.fixture
def mock_deployment_service():
    with (
        patch(
            "app.routes.admin.handlers.logger_config.get_resolved_deployment_logger_config"
        ) as mock_get,
        patch("app.routes.admin.handlers.logger_config.merge_and_persist") as mock_merge,
    ):
        mock_get.return_value = dict(_DEFAULT_DEPLOYMENT)
        mock_merge.return_value = dict(_DEFAULT_DEPLOYMENT)
        yield mock_get, mock_merge


def test_get_logger_config_returns_client_and_server(client, mock_deployment_service) -> None:
    mock_get, _ = mock_deployment_service
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.get(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    config = data["config"]
    assert "client" in config
    assert "server" in config
    for key in ALLOWED_LOGGER_CONFIG_KEYS:
        assert key in config["server"]
    mock_get.assert_called_once()


@pytest.mark.parametrize(
    "config_key,value",
    [
        ("polling", False),
        ("logLevel", "WARN"),
    ],
)
def test_post_logger_config_updates_server_scope(
    client, mock_deployment_service, config_key: str, value: object
) -> None:
    _, mock_merge = mock_deployment_service
    updated_server = {**_DEFAULT_SERVER, config_key: value}
    mock_merge.return_value = {"client": _DEFAULT_CLIENT, "server": updated_server}

    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"server": {**_DEFAULT_SERVER, config_key: value}}},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["config"]["server"][config_key] == value
    mock_merge.assert_called_once()


def test_post_logger_config_partial_client_patch(client, mock_deployment_service) -> None:
    _, mock_merge = mock_deployment_service
    updated_client = {**_DEFAULT_CLIENT, "search": False}
    mock_merge.return_value = {"client": updated_client, "server": _DEFAULT_SERVER}

    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"client": {"search": False}}},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    mock_merge.assert_called_once()
    call_updates = mock_merge.call_args[0][1]
    assert call_updates["client"]["search"] is False


def test_post_logger_config_updates_client_scope(client, mock_deployment_service) -> None:
    _, mock_merge = mock_deployment_service
    updated_client = {**_DEFAULT_CLIENT, "polling": True}
    mock_merge.return_value = {"client": updated_client, "server": _DEFAULT_SERVER}

    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"client": {**_DEFAULT_CLIENT, "polling": True}}},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["config"]["client"]["polling"] is True


def test_post_logger_config_rejects_unknown_server_keys(client, mock_deployment_service) -> None:
    _, mock_merge = mock_deployment_service

    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"server": {"notARealKey": True}}},
        )

    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data.get("error") == "validation_error"
    mock_merge.assert_not_called()


def test_get_logger_config_forbidden_for_non_admin(client, mock_deployment_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN_USER):
        response = client.get(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
        )

    assert response.status_code == 403
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "FORBIDDEN"
    assert "message" in data


def test_post_logger_config_forbidden_for_non_admin(client, mock_deployment_service) -> None:
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"server": {**_DEFAULT_SERVER, "polling": False}}},
        )

    assert response.status_code == 403
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "FORBIDDEN"


def test_post_logger_config_server_error_envelope(client, mock_deployment_service) -> None:
    _, mock_merge = mock_deployment_service
    mock_merge.side_effect = RuntimeError("db connection lost")

    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            "/api/v1/admin/logger-config",
            headers={"Authorization": "Bearer mock_token"},
            json={"updates": {"server": {**_DEFAULT_SERVER, "polling": False}}},
        )

    assert response.status_code == 500
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "database_error"
    assert "error_id" in data
    assert "db connection lost" not in str(data)
