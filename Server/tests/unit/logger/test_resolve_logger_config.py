"""Tests for environment-aware logger config resolution."""

import pytest

from logger.resolve_logger_config import (
    apply_production_guard,
    build_environment_defaults,
    resolve_logger_config,
)


@pytest.fixture(autouse=True)
def _clear_logger_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LOGGER_VERBOSE", raising=False)
    monkeypatch.delenv("LOGGER_CATEGORIES", raising=False)
    monkeypatch.delenv("LOGGER_POSTHOG", raising=False)
    monkeypatch.setenv("FLASK_ENV", "development")


def test_dev_defaults_off_except_errors_and_security() -> None:
    config = resolve_logger_config()
    assert config.polling is False
    assert config.errors is True
    assert config.security is True
    assert config.logLevel == "ERROR"


def test_prod_defaults_on(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("FLASK_ENV", "production")
    config = resolve_logger_config()
    assert config.polling is True
    assert config.api is True
    assert config.logLevel == "INFO"


def test_dev_category_env_override(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOGGER_CATEGORIES", "polling,api")
    config = resolve_logger_config()
    assert config.polling is True
    assert config.api is True
    assert config.pages is False


def test_apply_production_guard_forces_categories_on() -> None:
    guarded = apply_production_guard(build_environment_defaults(False))
    assert guarded["polling"] is True
    assert guarded["documents"] is True
