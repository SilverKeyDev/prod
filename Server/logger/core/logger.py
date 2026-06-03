"""
Centralized Logger with Category-Based Filtering
Supports runtime config reloading and PII scrubbing
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

from ..config.config_model import LoggerConfig, LogLevel
from ..config.logger_env import should_export_logs_to_posthog
from ..config.resolve_logger_config import merge_logger_config_update, resolve_logger_config
from ..export.posthog_otlp import emit_structured_log
from ..security.pii import create_safe_log_object, mask_sensitive_data
from .categories import LogCategory
from .check_category_enabled import should_emit_log
from .parse_log_path import parse_log_path


class Logger:
    """Centralized logger with category-based filtering and PII scrubbing"""

    def __init__(self, config_path: str | None = None):
        """Initialize logger (config_path retained for tests that inject JSON overrides)."""
        self.config_path = config_path
        self.config = self._load_config()
        self.is_processing = False
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
        """Load config with environment-aware defaults and optional test overrides."""
        overrides: dict[str, Any] = {}
        if self.config_path:
            try:
                if os.path.exists(self.config_path):
                    with open(self.config_path) as f:
                        overrides = json.load(f)
            except Exception:
                pass

        return resolve_logger_config(overrides or None)

    def reload_config(self) -> None:
        """Reload config from defaults (and optional test config_path)."""
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
        category_or_path: LogCategory | str,
        message: str,
        data: Any | None = None,
    ) -> None:
        """Emit to stdout and PostHog when category, level, and environment allow."""
        parsed = parse_log_path(category_or_path)
        if not should_emit_log(self.config, level, parsed.category):
            return

        try:
            safe_message, scrubbed_data = self._scrubbed_payload(message, data)
            formatted = self._format_message(
                level, parsed.category_label, safe_message, scrubbed_data
            )

            if should_export_logs_to_posthog():
                emit_structured_log(level, parsed.category_label, safe_message, scrubbed_data)

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

    def debug(self, category: LogCategory | str, message: str, data: Any | None = None) -> None:
        self._emit("DEBUG", category, message, data)

    def info(self, category: LogCategory | str, message: str, data: Any | None = None) -> None:
        self._emit("INFO", category, message, data)

    def warn(self, category: LogCategory | str, message: str, data: Any | None = None) -> None:
        self._emit("WARN", category, message, data)

    def error(
        self, category: LogCategory | str, message: str, error: Exception | Any | None = None
    ) -> None:
        self._emit("ERROR", category, message, self._normalize_error_data(error))

    def security(self, category: LogCategory | str, event: str, data: Any | None = None) -> None:
        scrubbed_data = create_safe_log_object(data) if data else None
        self._emit("SECURITY", category, f"🔒 {event}", scrubbed_data)

    def _format_message(
        self,
        level: LogLevel,
        category_label: str,
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
            return f"[{timestamp}] [{level}] [{category_label}] {message} [RECURSION_PREVENTED]"

        try:
            self.is_processing = True
            timestamp = datetime.now(timezone.utc).isoformat()
            prefix = f"[{timestamp}] [{level}] [{category_label}]"

            if data is not None:
                data_str = json.dumps(data, default=str)
                return f"{prefix} {message} {data_str}"

            return f"{prefix} {message}"
        except Exception:
            timestamp = datetime.now(timezone.utc).isoformat()
            return f"[{timestamp}] [{level}] [{category_label}] {message} [FORMAT_ERROR]"
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

    def debug(self, category: LogCategory | str, message: str, data: Any | None = None) -> None:
        logger.debug(category, message, data)

    def info(self, category: LogCategory | str, message: str, data: Any | None = None) -> None:
        logger.info(category, message, data)

    def warn(self, category: LogCategory | str, message: str, data: Any | None = None) -> None:
        logger.warn(category, message, data)

    def error(
        self, category: LogCategory | str, message: str, error: Exception | Any | None = None
    ) -> None:
        logger.error(category, message, error)

    def security(self, category: LogCategory | str, event: str, data: Any | None = None) -> None:
        logger.security(category, event, data)

    def reload_config(self) -> None:
        logger.reload_config()

    def update_config(self, updates: dict[str, Any]) -> None:
        logger.update_config(updates)

    def get_config(self) -> dict[str, Any]:
        return logger.get_config()


log = LogProxy()
