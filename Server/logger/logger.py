"""
Centralized Logger with Category-Based Filtering
Supports runtime config reloading and PII scrubbing
"""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .categories import LogCategory
from .check_category_enabled import should_emit_log
from .config_model import LoggerConfig, LogLevel
from .logger_env import should_export_logs_to_posthog
from .pii import create_safe_log_object, mask_sensitive_data
from .posthog_otlp import emit_structured_log
from .resolve_logger_config import merge_logger_config_update, resolve_logger_config


class Logger:
    """Centralized logger with category-based filtering and PII scrubbing"""

    def __init__(self, config_path: str | None = None):
        """
        Initialize logger

        Args:
            config_path: Path to logger_config.json file. If None, uses default location.
        """
        # Determine config file path
        if config_path is None:
            # Default to Server/logger/logger_config.json
            base_dir = Path(__file__).parent.parent
            config_path = str(base_dir / "logger" / "logger_config.json")

        self.config_path = config_path
        self.config = self._load_config()
        self.is_processing = False

        # Set up Python logging
        self._setup_python_logging()

    def _setup_python_logging(self) -> None:
        """Set up Python logging module"""
        # Get or create logger
        self._py_logger = logging.getLogger("app.logger")

        # Set level based on config
        level_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARN": logging.WARNING,
            "ERROR": logging.ERROR,
        }
        self._py_logger.setLevel(level_map.get(self.config.logLevel, logging.DEBUG))

        # Add handler if none exists
        if not self._py_logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(
                logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            )
            self._py_logger.addHandler(handler)
        # Root also has a StreamHandler from configure_app_logging; avoid duplicate lines.
        self._py_logger.propagate = False

    def _load_config(self) -> LoggerConfig:
        """Load config from JSON file with environment-aware defaults."""
        overrides: dict[str, Any] = {}
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path) as f:
                    overrides = json.load(f)
        except Exception:
            pass

        return resolve_logger_config(overrides)

    def reload_config(self) -> None:
        """Reload config from file"""
        try:
            self.config = self._load_config()
            self._setup_python_logging()
        except Exception as e:
            self._py_logger.warning(f"[Logger] Failed to reload config: {e}")

    def update_config(self, updates: dict[str, Any]) -> None:
        """
        Update config programmatically (for runtime toggling)

        Args:
            updates: Dictionary of config updates
        """
        self.config = merge_logger_config_update(self.config, updates)
        self._setup_python_logging()

    def get_config(self) -> dict[str, Any]:
        """
        Get current config (read-only copy)

        Returns:
            Dictionary copy of current config
        """
        return self.config.to_dict()

    def _normalize_error_data(self, error: Exception | Any | None) -> Any | None:
        if error is None:
            return None
        if isinstance(error, Exception):
            error_data: dict[str, Any] = {
                "name": type(error).__name__,
                "message": str(error),
                "stack": None,
            }
            import traceback

            try:
                error_data["stack"] = traceback.format_exc()
            except Exception:
                pass
            return error_data
        return error

    def _scrubbed_payload(self, message: str, data: Any | None) -> tuple[str, Any | None]:
        safe_message = mask_sensitive_data(message)
        scrubbed_data = create_safe_log_object(data) if data is not None else None
        return safe_message, scrubbed_data

    def _emit(
        self,
        level: LogLevel,
        category: LogCategory,
        message: str,
        data: Any | None = None,
    ) -> None:
        """Emit to stdout and PostHog when category, level, and environment allow."""
        if not should_emit_log(self.config, level, category):
            return

        try:
            safe_message, scrubbed_data = self._scrubbed_payload(message, data)
            formatted = self._format_message(level, category, safe_message, scrubbed_data)

            if should_export_logs_to_posthog():
                emit_structured_log(level, category.value, safe_message, scrubbed_data)

            py_level = {
                "DEBUG": self._py_logger.debug,
                "INFO": self._py_logger.info,
                "WARN": self._py_logger.warning,
                "SECURITY": self._py_logger.warning,
                "ERROR": self._py_logger.error,
            }.get(level, self._py_logger.info)
            py_level(formatted)
        except Exception as e:
            self._py_logger.error(f"[Logger] Emit error ({level}): {e}")

    def debug(self, category: LogCategory, message: str, data: Any | None = None) -> None:
        self._emit("DEBUG", category, message, data)

    def info(self, category: LogCategory, message: str, data: Any | None = None) -> None:
        self._emit("INFO", category, message, data)

    def warn(self, category: LogCategory, message: str, data: Any | None = None) -> None:
        self._emit("WARN", category, message, data)

    def error(
        self, category: LogCategory, message: str, error: Exception | Any | None = None
    ) -> None:
        self._emit("ERROR", category, message, self._normalize_error_data(error))

    def security(self, category: LogCategory, event: str, data: Any | None = None) -> None:
        scrubbed_data = create_safe_log_object(data) if data else None
        self._emit("SECURITY", category, f"🔒 {event}", scrubbed_data)

    def _format_message(
        self,
        level: LogLevel,
        category: LogCategory,
        message: str,
        data: Any | None = None,
    ) -> str:
        """
        Format log message with timestamp and category

        Args:
            level: Log level
            category: Log category
            message: Log message (already scrubbed when called from _emit)
            data: Optional data to include (already scrubbed when called from _emit)

        Returns:
            Formatted log message
        """
        if self.is_processing:
            timestamp = datetime.now(timezone.utc).isoformat()
            return f"[{timestamp}] [{level}] [{category.value}] {message} [RECURSION_PREVENTED]"

        try:
            self.is_processing = True
            timestamp = datetime.now(timezone.utc).isoformat()
            prefix = f"[{timestamp}] [{level}] [{category.value}]"

            if data is not None:
                data_str = json.dumps(data, default=str)
                return f"{prefix} {message} {data_str}"

            return f"{prefix} {message}"
        except Exception:
            timestamp = datetime.now(timezone.utc).isoformat()
            return f"[{timestamp}] [{level}] [{category.value}] {message} [FORMAT_ERROR]"
        finally:
            self.is_processing = False


# Export singleton instance
_logger_instance: Logger | None = None


def get_logger() -> Logger:
    """Get or create singleton logger instance"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    return _logger_instance


# Convenience exports
logger = get_logger()


class LogProxy:
    """Convenience proxy for logger instance"""

    def debug(self, category: LogCategory, message: str, data: Any | None = None) -> None:
        logger.debug(category, message, data)

    def info(self, category: LogCategory, message: str, data: Any | None = None) -> None:
        logger.info(category, message, data)

    def warn(self, category: LogCategory, message: str, data: Any | None = None) -> None:
        logger.warn(category, message, data)

    def error(
        self, category: LogCategory, message: str, error: Exception | Any | None = None
    ) -> None:
        logger.error(category, message, error)

    def security(self, category: LogCategory, event: str, data: Any | None = None) -> None:
        logger.security(category, event, data)

    def reload_config(self) -> None:
        logger.reload_config()

    def update_config(self, updates: dict[str, Any]) -> None:
        logger.update_config(updates)

    def get_config(self) -> dict[str, Any]:
        return logger.get_config()


log = LogProxy()
