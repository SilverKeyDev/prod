"""
Centralized logging configuration and utilities for the entire application.
"""

import logging
import os
import sys

from flask import current_app, has_app_context

_LOG_LEVEL_NAMES = ("DEBUG", "INFO", "WARNING", "WARN", "ERROR", "CRITICAL")


def _resolve_app_log_level() -> int:
    """
    Flask / stdlib log level: env APP_LOG_LEVEL wins, then centralized logger logLevel, then INFO.
    """
    env_level = (
        (os.environ.get("APP_LOG_LEVEL") or os.environ.get("LOG_LEVEL") or "").strip().upper()
    )
    if env_level in _LOG_LEVEL_NAMES:
        return getattr(logging, env_level if env_level != "WARN" else "WARNING")

    try:
        from logger import log

        config = log.get_config()
        name = str(config.get("logLevel", "INFO")).strip().upper()
        if name in _LOG_LEVEL_NAMES:
            return getattr(logging, name if name != "WARN" else "WARNING")
    except Exception:
        pass

    return logging.INFO


# Global logger cache to avoid repeated instantiation
_logger_cache = {}


def get_logger(name: str | None = None) -> logging.Logger:
    """
    Get a logger instance with automatic name detection and caching.

    Args:
        name: Logger name. If None, automatically detects from calling module.

    Returns:
        Configured logger instance
    """
    if name is None:
        # Auto-detect calling module name
        frame = sys._getframe(1)
        name = frame.f_globals.get("__name__", "app")

    # Return cached logger if available
    if name in _logger_cache:
        return _logger_cache[name]

    # Create and configure logger
    if has_app_context() and name == "app":
        logger = current_app.logger
    else:
        logger = logging.getLogger(name)

    # Cache the logger
    _logger_cache[name] = logger
    return logger


def configure_app_logging(app):
    """
    Configure logging for the entire application.
    Call this once during app initialization.
    """
    level = _resolve_app_log_level()

    # Set up root logger configuration
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Configure Flask app logger (polygon search and other app.* messages use this)
    app.logger.setLevel(level)

    # Silence verbose third-party libraries
    verbose_loggers = [
        "botocore",
        "boto3",
        "urllib3",
        "s3transfer",
        "matplotlib",
        "celery",
        "werkzeug",
        "openai",
        "httpx",
        "httpcore",
        "requests.packages.urllib3",
        "PIL",
        "google_auth_httplib2",
    ]

    for logger_name in verbose_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)

    # Application loggers: match resolved level; keep SQLAlchemy model noise down
    for logger_name in ("app.routes", "app.services", "app.utils", "app.celery"):
        logging.getLogger(logger_name).setLevel(level)
    logging.getLogger("app.models").setLevel(logging.WARNING)


# Convenience function for common logging patterns
def log_user_action(action: str, user_id: str, details: dict | None = None):
    """Log user actions with consistent formatting."""
    logger = get_logger()
    details_str = f" - {details}" if details else ""
    logger.info(f"👤 User {user_id}: {action}{details_str}")


def log_api_call(endpoint: str, method: str, status_code: int, duration_ms: float | None = None):
    """Log API calls with consistent formatting."""
    logger = get_logger()
    duration_str = f" ({duration_ms:.2f}ms)" if duration_ms is not None else ""
    status_emoji = "✅" if 200 <= status_code < 300 else "⚠️" if 400 <= status_code < 500 else "❌"
    logger.info(f"{status_emoji} {method} {endpoint} - {status_code}{duration_str}")


def log_error_with_context(error: Exception, context: dict | None = None):
    """Log errors with additional context."""
    logger = get_logger()
    context_str = f" Context: {context}" if context else ""
    logger.error(f"❌ {type(error).__name__}: {str(error)}{context_str}")


def log_performance(operation: str, duration_ms: float, threshold_ms: float = 1000):
    """Log performance metrics with warnings for slow operations."""
    logger = get_logger()
    emoji = "🐌" if duration_ms > threshold_ms else "⚡"
    logger.info(f"{emoji} {operation} completed in {duration_ms:.2f}ms")

    if duration_ms > threshold_ms:
        logger.warning(f"⚠️ Slow operation detected: {operation} took {duration_ms:.2f}ms")
