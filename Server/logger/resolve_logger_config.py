"""Resolve logger config with environment-aware defaults."""

from typing import Any

from .config_model import LoggerConfig
from .logger_env import (
    is_logger_production,
    is_logger_verbose_dev,
    parse_dev_category_overrides,
)

LOGGER_BOOLEAN_KEYS = (
    "polling",
    "pages",
    "hooks",
    "auth",
    "http",
    "polygonSearch",
    "docusign",
    "documents",
    "profilePreferences",
)


def build_environment_defaults(is_prod: bool) -> dict[str, Any]:
    bool_value = is_prod
    return {
        "polling": bool_value,
        "pages": bool_value,
        "hooks": bool_value,
        "auth": bool_value,
        "http": bool_value,
        "api": bool_value,
        "errors": True,
        "security": True,
        "polygonSearch": bool_value,
        "docusign": bool_value,
        "documents": bool_value,
        "profilePreferences": bool_value,
        "logLevel": "INFO" if is_prod else "ERROR",
    }


def apply_dev_category_overrides(config: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    if not keys:
        return config
    next_config = dict(config)
    for key in keys:
        if key == "api" or key in LOGGER_BOOLEAN_KEYS:
            next_config[key] = True
    return next_config


def apply_dev_verbose(config: dict[str, Any]) -> dict[str, Any]:
    next_config = dict(config)
    for key in LOGGER_BOOLEAN_KEYS:
        next_config[key] = True
    next_config["api"] = True
    next_config["logLevel"] = "DEBUG"
    next_config["errors"] = True
    next_config["security"] = True
    return next_config


def apply_production_guard(config: dict[str, Any]) -> dict[str, Any]:
    next_config = dict(config)
    for key in LOGGER_BOOLEAN_KEYS:
        next_config[key] = True
    next_config["api"] = True
    next_config["errors"] = True
    next_config["security"] = True
    return next_config


def resolve_logger_config(overrides: dict[str, Any] | None = None) -> LoggerConfig:
    is_prod = is_logger_production()
    config_dict = build_environment_defaults(is_prod)
    if overrides:
        config_dict.update(overrides)

    if not is_prod:
        if is_logger_verbose_dev():
            config_dict = apply_dev_verbose(config_dict)
        else:
            config_dict = apply_dev_category_overrides(config_dict, parse_dev_category_overrides())
    else:
        config_dict = apply_production_guard(config_dict)

    return LoggerConfig(config_dict)


def merge_logger_config_update(current: LoggerConfig, updates: dict[str, Any]) -> LoggerConfig:
    merged = current.to_dict()
    merged.update(updates)
    config = LoggerConfig(merged)
    if is_logger_production():
        guarded = apply_production_guard(config.to_dict())
        return LoggerConfig(guarded)
    return config
