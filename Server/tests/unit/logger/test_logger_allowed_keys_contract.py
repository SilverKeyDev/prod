"""Admin logger-config allowed keys must match LoggerConfig fields."""

from logger.config.allowed_logger_config_keys_generated import ALLOWED_LOGGER_CONFIG_KEYS
from logger.config.config_model import LoggerConfig


def test_allowed_logger_config_keys_match_logger_config_to_dict() -> None:
    config_keys = frozenset(LoggerConfig({}).to_dict().keys())
    assert ALLOWED_LOGGER_CONFIG_KEYS == config_keys
