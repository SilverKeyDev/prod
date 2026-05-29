"""Codegen parity tests for log contracts."""

from log_contracts.schema import DEFAULT_YAML_PATH, boolean_keys, load_categories_yaml

from logger.config.allowed_logger_config_keys_generated import ALLOWED_LOGGER_CONFIG_KEYS
from logger.config.config_model import LoggerConfig
from logger.config.logger_contract_generated import LOGGER_BOOLEAN_KEYS, build_environment_defaults
from logger.core.categories import LogCategory, category_to_config_key


def test_yaml_categories_match_log_category_enum() -> None:
    _, categories = load_categories_yaml(DEFAULT_YAML_PATH)
    yaml_names = {category.name for category in categories}
    enum_names = {member.value for member in LogCategory}
    assert yaml_names == enum_names


def test_boolean_keys_match_non_api_config_keys() -> None:
    _, categories = load_categories_yaml(DEFAULT_YAML_PATH)
    assert set(LOGGER_BOOLEAN_KEYS) == set(boolean_keys(categories))


def test_allowed_keys_match_logger_config_to_dict() -> None:
    assert ALLOWED_LOGGER_CONFIG_KEYS == frozenset(LoggerConfig({}).to_dict().keys())


def test_category_to_config_key_maps_all_categories() -> None:
    for category in LogCategory:
        key = category_to_config_key(category)
        assert hasattr(LoggerConfig({}), key)


def test_build_environment_defaults_includes_all_boolean_keys() -> None:
    defaults = build_environment_defaults(is_prod=False)
    for key in LOGGER_BOOLEAN_KEYS:
        assert key in defaults
    assert defaults["api"] is False
    assert defaults["errors"] is True
    assert defaults["security"] is True
