"""Deployment logger config service tests."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.admin.deployment_logger_config import (
    get_resolved_deployment_logger_config,
    merge_and_persist,
    resolve_client_config,
    resolve_server_config,
)


@pytest.fixture
def mock_db_session():
    with patch("app.services.admin.deployment_logger_config.db") as mock_db:
        mock_db.session.get.return_value = None
        mock_db.session.add = MagicMock()
        mock_db.session.commit = MagicMock()
        mock_db.session.flush = MagicMock()
        yield mock_db


def test_resolve_server_config_applies_defaults() -> None:
    resolved = resolve_server_config({})
    assert resolved["errors"] is True
    assert resolved["security"] is True
    assert "logLevel" in resolved


def test_resolve_client_config_nested_api() -> None:
    resolved = resolve_client_config({"api": {"polling": True}})
    assert isinstance(resolved["api"], dict)
    assert resolved["api"]["polling"] is True


def test_merge_and_persist_returns_none_for_empty_updates(mock_db_session) -> None:
    assert merge_and_persist("user-1", {}) is None


def test_merge_and_persist_server_updates(mock_db_session) -> None:
    with patch(
        "app.services.admin.deployment_logger_config.get_resolved_deployment_logger_config"
    ) as mock_resolved:
        mock_resolved.return_value = {
            "client": resolve_client_config({}),
            "server": resolve_server_config({"polling": False}),
        }
        result = merge_and_persist("user-1", {"server": {"polling": False}})
        assert result is not None
        assert result["server"]["polling"] is False
        mock_db_session.session.commit.assert_called_once()


def test_get_resolved_deployment_logger_config_empty_db(mock_db_session) -> None:
    config = get_resolved_deployment_logger_config()
    assert "client" in config
    assert "server" in config
