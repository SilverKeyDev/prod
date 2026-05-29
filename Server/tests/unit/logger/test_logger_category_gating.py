"""Logger category and level gating."""

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


def _logger_with_config(overrides: dict[str, object] | None = None) -> Logger:
    config = {
        "polling": False,
        "pages": False,
        "hooks": False,
        "auth": False,
        "http": False,
        "api": False,
        "errors": True,
        "security": True,
        "polygonSearch": False,
        "docusign": False,
        "documents": False,
        "profilePreferences": False,
        "logLevel": "DEBUG",
    }
    if overrides:
        config.update(overrides)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tmp:
        json.dump(config, tmp)
        tmp_path = tmp.name
    try:
        with patch("logger.resolve_logger_config.is_logger_production", return_value=False):
            return Logger(config_path=tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@pytest.mark.parametrize(("config_key", "category"), _CONFIG_KEY_TO_CATEGORY)
def test_info_not_emitted_when_category_disabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: False, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "info") as mock_info,
        patch("logger.logger.emit_structured_log") as mock_posthog,
        patch("logger.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.info(category, "gated message")
        mock_info.assert_not_called()
        mock_posthog.assert_not_called()


@pytest.mark.parametrize(("config_key", "category"), _CONFIG_KEY_TO_CATEGORY)
def test_info_emitted_when_category_enabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: True, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "info") as mock_info,
        patch("logger.logger.emit_structured_log") as mock_posthog,
        patch("logger.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.info(category, "enabled message")
        mock_info.assert_called_once()
        mock_posthog.assert_called_once()


def test_debug_not_emitted_at_info_log_level_config() -> None:
    logger = _logger_with_config({"api": True, "logLevel": "INFO"})
    with (
        patch.object(logger._py_logger, "debug") as mock_debug,
        patch("logger.logger.emit_structured_log") as mock_posthog,
        patch("logger.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.debug(LogCategory.API, "debug gated by level")
        mock_debug.assert_not_called()
        mock_posthog.assert_not_called()


def test_security_emits_when_config_bool_false() -> None:
    logger = _logger_with_config({"security": False, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "warning") as mock_warning,
        patch("logger.logger.emit_structured_log") as mock_posthog,
        patch("logger.logger.should_export_logs_to_posthog", return_value=True),
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
