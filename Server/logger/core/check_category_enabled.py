"""Category enablement checks for server logger."""

from ..config.config_model import LOG_LEVELS, LoggerConfig
from .categories import LogCategory, category_to_config_key, is_always_enabled


def is_log_level_enabled(config_level: str, message_level: str) -> bool:
    return LOG_LEVELS.get(message_level, 0) >= LOG_LEVELS.get(config_level, 0)


def check_category_enabled(config: LoggerConfig, category: LogCategory) -> bool:
    if is_always_enabled(category):
        return True
    config_key = category_to_config_key(category)
    return bool(getattr(config, config_key, False))


def should_emit_log(config: LoggerConfig, level: str, category: LogCategory) -> bool:
    if not check_category_enabled(config, category):
        return False
    return is_log_level_enabled(config.logLevel, level)
