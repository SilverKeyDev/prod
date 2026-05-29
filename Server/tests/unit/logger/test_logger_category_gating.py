"""Logger category and level gating."""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from logger.config.config_model import LoggerConfig
from logger.core.categories import LogCategory, category_to_config_key, is_always_enabled
from logger.core.logger import Logger

_CONFIG_KEY_TO_CATEGORY: list[tuple[str, LogCategory]] = [
    (category_to_config_key(category), category)
    for category in LogCategory
    if not is_always_enabled(category)
]


def _logger_with_config(overrides: dict[str, object] | None = None) -> Logger:
    config = LoggerConfig({}).to_dict()
    config["logLevel"] = "DEBUG"
    if overrides:
        config.update(overrides)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tmp:
        json.dump(config, tmp)
        tmp_path = tmp.name
    try:
        with patch("logger.config.resolve_logger_config.is_logger_production", return_value=False):
            return Logger(config_path=tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@pytest.mark.parametrize(("config_key", "category"), _CONFIG_KEY_TO_CATEGORY)
def test_info_not_emitted_when_category_disabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: False, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "info") as mock_info,
        patch("logger.core.logger.emit_structured_log") as mock_posthog,
        patch("logger.core.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.info(category, "gated message")
        mock_info.assert_not_called()
        mock_posthog.assert_not_called()


@pytest.mark.parametrize(("config_key", "category"), _CONFIG_KEY_TO_CATEGORY)
def test_info_emitted_when_category_enabled(config_key: str, category: LogCategory) -> None:
    logger = _logger_with_config({config_key: True, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "info") as mock_info,
        patch("logger.core.logger.emit_structured_log") as mock_posthog,
        patch("logger.core.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.info(category, "enabled message")
        mock_info.assert_called_once()
        mock_posthog.assert_called_once()


def test_debug_not_emitted_at_info_log_level_config() -> None:
    logger = _logger_with_config({"api": True, "logLevel": "INFO"})
    with (
        patch.object(logger._py_logger, "debug") as mock_debug,
        patch("logger.core.logger.emit_structured_log") as mock_posthog,
        patch("logger.core.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.debug(LogCategory.API, "debug gated by level")
        mock_debug.assert_not_called()
        mock_posthog.assert_not_called()


def test_security_emits_when_config_bool_false() -> None:
    logger = _logger_with_config({"security": False, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "warning") as mock_warning,
        patch("logger.core.logger.emit_structured_log") as mock_posthog,
        patch("logger.core.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.security(LogCategory.SECURITY, "security event")
        mock_warning.assert_called_once()
        mock_posthog.assert_called_once()


def test_info_emitted_with_dot_notation_path() -> None:
    logger = _logger_with_config({"api": True, "logLevel": "DEBUG"})
    with (
        patch.object(logger._py_logger, "info") as mock_info,
        patch("logger.core.logger.emit_structured_log") as mock_posthog,
        patch("logger.core.logger.should_export_logs_to_posthog", return_value=True),
    ):
        logger.info("API.POLLING", "dot notation message")
        mock_info.assert_called_once()
        mock_posthog.assert_called_once()
        assert mock_posthog.call_args.args[1] == "API.POLLING"


@pytest.mark.parametrize(
    ("category", "expected_key"),
    [(cat, category_to_config_key(cat)) for cat in LogCategory],
)
def test_category_to_config_key_maps_all_categories(
    category: LogCategory, expected_key: str
) -> None:
    assert category_to_config_key(category) == expected_key
    assert hasattr(_logger_with_config().config, expected_key)
