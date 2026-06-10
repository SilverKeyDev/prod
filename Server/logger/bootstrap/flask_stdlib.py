"""
Configure stdlib logging for Flask, Werkzeug, and third-party libraries.

Product/feature logs must use `from logger import log` with LogPath categories.
This module only tunes infrastructure noise at app startup.
"""

from __future__ import annotations

import logging
import os
import sys

_LOG_LEVEL_NAMES = ("DEBUG", "INFO", "WARNING", "WARN", "ERROR", "CRITICAL")

_VERBOSE_LOGGER_NAMES = (
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
)

_APP_LOGGER_PREFIXES = ("app.routes", "app.services", "app.utils", "app.celery")


def _resolve_app_log_level() -> int:
    """Flask/stdlib level: APP_LOG_LEVEL env, then SilverKey logger config, else INFO."""
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


def configure_flask_stdlib_logging(app) -> None:
    """Call once from create_app: basicConfig, Flask app.logger level, library silencing."""
    level = _resolve_app_log_level()

    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    app.logger.setLevel(level)

    for logger_name in _VERBOSE_LOGGER_NAMES:
        logging.getLogger(logger_name).setLevel(logging.WARNING)

    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

    for logger_name in _APP_LOGGER_PREFIXES:
        logging.getLogger(logger_name).setLevel(level)
    logging.getLogger("app.models").setLevel(logging.WARNING)
