"""Logger category toggles and log level gating."""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from logger.categories import LogCategory, category_to_config_key
from logger.logger import Logger

# Config key -> LogCategory for parametrized gating tests (excludes always-on categories).
_CONFIG_KEY_TO_CATEGORY: list[tuple[str, LogCategory]] = [
    ("polling", LogCategory.POLLING),
    ("pages", LogCategory.PAGES),
    ("hooks", LogCategory.HOOKS),
    ("auth", LogCategory.AUTH),
    ("http", LogCategory.HTTP),
    ("api", LogCategory.API),
    ("polygonSearch", LogCategory.POLYGON_SEARCH),
    ("docusign", LogCategory.DOCUSIGN),
    ("documents", LogCategory.DOCUMENTS),
    ("profilePreferences", LogCategory.PROFILE_PREFERENCES),
]

_ALWAYS_ON_CATEGORIES = (LogCategory.ERRORS, LogCategory.SECURITY)


def _default_config_dict() -> dict[str, object]:
    return {
        "polling": True,
        "pages": True,
        "hooks": True,
        "auth": True,
        "http": True,
        "api": True,
        "errors": True,
        "security": True,
        "polygonSearch": True,
        "docusign": True,
        "documents": True,
        "profilePreferences": True,
        "logLevel": "DEBUG",
    }


def _logger_with_config(overrides: dict[str, object] | None = None) -> Logger:
    config = _default_config_dict()
    if overrides:
        config.update(overrides)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tmp:
        json.dump(config, tmp)
        tmp_path = tmp.name
    try:
        return Logger(config_path=tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@pytest.mark.parametrize(("config_key", "category"), _CONFIG_KEY_TO_CATEGORY)
def test_info_suppressed_when_category_disabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: False, "logLevel": "DEBUG"})
    with patch.object(logger._py_logger, "info") as mock_info:
        logger.info(category, "gated message")
        mock_info.assert_not_called()


@pytest.mark.parametrize(("config_key", "category"), _CONFIG_KEY_TO_CATEGORY)
def test_info_emitted_when_category_enabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: True, "logLevel": "DEBUG"})
    with patch.object(logger._py_logger, "info") as mock_info:
        logger.info(category, "gated message")
        mock_info.assert_called_once()


@pytest.mark.parametrize("category", _ALWAYS_ON_CATEGORIES)
def test_always_on_categories_emit_even_when_config_bool_false(category: LogCategory) -> None:
    config_key = category_to_config_key(category)
    logger = _logger_with_config({config_key: False, "logLevel": "DEBUG"})
    with patch.object(logger._py_logger, "error") as mock_error:
        logger.error(category, "always on")
        mock_error.assert_called_once()


def test_security_emits_even_when_config_bool_false() -> None:
    logger = _logger_with_config({"security": False, "logLevel": "DEBUG"})
    with patch.object(logger._py_logger, "warning") as mock_warning:
        logger.security(LogCategory.SECURITY, "security event")
        mock_warning.assert_called_once()


def test_debug_suppressed_at_info_log_level() -> None:
    logger = _logger_with_config({"api": True, "logLevel": "INFO"})
    with patch.object(logger._py_logger, "debug") as mock_debug:
        logger.debug(LogCategory.API, "debug only")
        mock_debug.assert_not_called()


def test_info_emitted_at_info_log_level() -> None:
    logger = _logger_with_config({"api": True, "logLevel": "INFO"})
    with patch.object(logger._py_logger, "info") as mock_info:
        logger.info(LogCategory.API, "info allowed")
        mock_info.assert_called_once()


@pytest.mark.parametrize(
    ("category", "expected_key"),
    [(cat, category_to_config_key(cat)) for cat in LogCategory],
)
def test_category_to_config_key_maps_all_categories(
    category: LogCategory, expected_key: str
) -> None:
    assert category_to_config_key(category) == expected_key
    assert hasattr(_logger_with_config().config, expected_key)
