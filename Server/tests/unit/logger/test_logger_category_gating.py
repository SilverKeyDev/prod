"""Logger always-on emission and PostHog export."""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from logger.categories import LogCategory, category_to_config_key
from logger.logger import Logger

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
def test_info_emitted_when_category_disabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: False, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "info") as mock_info,
        patch("logger.logger.emit_structured_log") as mock_posthog,
    ):
        logger.info(category, "always on message")
        mock_info.assert_called_once()
        mock_posthog.assert_called_once()


@pytest.mark.parametrize(("config_key", "category"), _CONFIG_KEY_TO_CATEGORY)
def test_info_emitted_when_category_enabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: True, "logLevel": "DEBUG"})
    with patch.object(logger._py_logger, "info") as mock_info:
        logger.info(category, "always on message")
        mock_info.assert_called_once()


def test_debug_emitted_at_info_log_level_config() -> None:
    logger = _logger_with_config({"api": True, "logLevel": "INFO"})
    with (
        patch.object(logger._py_logger, "debug") as mock_debug,
        patch("logger.logger.emit_structured_log") as mock_posthog,
    ):
        logger.debug(LogCategory.API, "debug always on")
        mock_debug.assert_called_once()
        mock_posthog.assert_called_once()


def test_security_emits_to_posthog_when_config_bool_false() -> None:
    logger = _logger_with_config({"security": False, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "warning") as mock_warning,
        patch("logger.logger.emit_structured_log") as mock_posthog,
    ):
        logger.security(LogCategory.SECURITY, "security event")
        mock_warning.assert_called_once()
        mock_posthog.assert_called_once()


@pytest.mark.parametrize(
    ("category", "expected_key"),
    [(cat, category_to_config_key(cat)) for cat in LogCategory],
)
def test_category_to_config_key_maps_all_categories(
    category: LogCategory, expected_key: str
) -> None:
    assert category_to_config_key(category) == expected_key
    assert hasattr(_logger_with_config().config, expected_key)
