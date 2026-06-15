"""
Logger Public API
"""

from .bootstrap.flask_stdlib import configure_flask_stdlib_logging
from .config.config_model import LoggerConfig
from .core.categories import LOG_CATEGORIES, LogCategory
from .core.logger import get_logger, log, logger

__all__ = [
    "log",
    "logger",
    "get_logger",
    "LogCategory",
    "LOG_CATEGORIES",
    "LoggerConfig",
    "configure_flask_stdlib_logging",
]
