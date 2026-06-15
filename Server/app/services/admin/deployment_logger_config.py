"""Persist and resolve deployment-wide logger configuration."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from app import db
from app.models.system.deployment_logger_config import (
    DEFAULT_DEPLOYMENT_LOGGER_CONFIG_ID,
    DeploymentLoggerConfig,
)
from logger.config.allowed_logger_config_keys_generated import ALLOWED_LOGGER_CONFIG_KEYS
from logger.config.config_model import LOG_LEVELS
from logger.config.logger_contract_generated import LOGGER_BOOLEAN_KEYS
from logger.config.resolve_logger_config import resolve_logger_config

CLIENT_API_SUBCATEGORY_KEYS = ("initialLoad", "polling", "pageMount", "other")
VALID_LOG_LEVELS = frozenset(LOG_LEVELS.keys())
# ERRORS and SECURITY are always enabled at runtime; never persist admin toggles for them.
ALWAYS_ON_LOGGER_CONFIG_KEYS = frozenset({"errors", "security"})


def _empty_stored_document() -> dict[str, dict[str, Any]]:
    return {"client": {}, "server": {}}


def _strip_always_on_keys(scope: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in scope.items() if key not in ALWAYS_ON_LOGGER_CONFIG_KEYS}


def _normalize_stored_config(raw: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(raw, dict):
        return _empty_stored_document()
    client = raw.get("client")
    server = raw.get("server")
    return {
        "client": _strip_always_on_keys(dict(client) if isinstance(client, dict) else {}),
        "server": _strip_always_on_keys(dict(server) if isinstance(server, dict) else {}),
    }


def _get_or_create_row() -> DeploymentLoggerConfig:
    row = db.session.get(DeploymentLoggerConfig, DEFAULT_DEPLOYMENT_LOGGER_CONFIG_ID)
    if row is None:
        row = DeploymentLoggerConfig(
            id=DEFAULT_DEPLOYMENT_LOGGER_CONFIG_ID,
            config=_empty_stored_document(),
        )
        db.session.add(row)
        db.session.flush()
    return row


def get_stored_deployment_logger_config() -> dict[str, dict[str, Any]]:
    row = db.session.get(DeploymentLoggerConfig, DEFAULT_DEPLOYMENT_LOGGER_CONFIG_ID)
    if row is None:
        return _empty_stored_document()
    return _normalize_stored_config(row.config)


def _build_client_environment_defaults(is_prod: bool) -> dict[str, Any]:
    config: dict[str, Any] = {}
    for key in LOGGER_BOOLEAN_KEYS:
        if key in ("errors", "security"):
            config[key] = True
        else:
            config[key] = is_prod
    config["api"] = dict.fromkeys(CLIENT_API_SUBCATEGORY_KEYS, is_prod)
    config["logLevel"] = "INFO" if is_prod else "ERROR"
    return config


def _merge_client_api_config(
    base: dict[str, Any] | bool,
    override: dict[str, Any] | bool | None,
) -> dict[str, Any] | bool:
    if override is None:
        return base
    if isinstance(override, bool):
        if override:
            return dict.fromkeys(CLIENT_API_SUBCATEGORY_KEYS, True)
        return dict.fromkeys(CLIENT_API_SUBCATEGORY_KEYS, False)
    if isinstance(base, bool):
        return override
    merged = dict(base)
    for key, value in override.items():
        if key in CLIENT_API_SUBCATEGORY_KEYS and isinstance(value, bool):
            merged[key] = value
    return merged


def resolve_client_config(stored: dict[str, Any] | None = None) -> dict[str, Any]:
    from logger.config.logger_env import (
        is_logger_production,
        is_logger_verbose_dev,
        parse_dev_category_overrides,
    )
    from logger.config.resolve_logger_config import (
        apply_dev_category_overrides,
        apply_dev_verbose,
    )

    is_prod = is_logger_production()
    config = _build_client_environment_defaults(is_prod)
    if stored:
        flat_updates = {k: v for k, v in stored.items() if k != "api"}
        config.update(flat_updates)
        if "api" in stored:
            config["api"] = _merge_client_api_config(config["api"], stored["api"])

    if not is_prod:
        if is_logger_verbose_dev():
            config = apply_dev_verbose(config)
            config["api"] = dict.fromkeys(CLIENT_API_SUBCATEGORY_KEYS, True)
        else:
            config = apply_dev_category_overrides(config, parse_dev_category_overrides())
            if "api" in parse_dev_category_overrides():
                config["api"] = dict.fromkeys(CLIENT_API_SUBCATEGORY_KEYS, True)
    else:
        for key in LOGGER_BOOLEAN_KEYS:
            config[key] = True
        config["api"] = dict.fromkeys(CLIENT_API_SUBCATEGORY_KEYS, True)

    config["logLevel"] = _normalize_log_level(config.get("logLevel"), config["logLevel"])
    return config


def resolve_server_config(stored: dict[str, Any] | None = None) -> dict[str, Any]:
    resolved = resolve_logger_config(stored or None)
    return resolved.to_dict()


def get_resolved_deployment_logger_config() -> dict[str, dict[str, Any]]:
    stored = get_stored_deployment_logger_config()
    return {
        "client": resolve_client_config(stored["client"]),
        "server": resolve_server_config(stored["server"]),
    }


def _normalize_log_level(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value in VALID_LOG_LEVELS:
        return value
    return fallback


def _filter_server_updates(updates: dict[str, Any]) -> dict[str, Any]:
    safe: dict[str, Any] = {}
    for key, value in updates.items():
        if key in ALWAYS_ON_LOGGER_CONFIG_KEYS:
            continue
        if key not in ALLOWED_LOGGER_CONFIG_KEYS:
            continue
        if key == "logLevel":
            if isinstance(value, str) and value in VALID_LOG_LEVELS:
                safe[key] = value
            continue
        if isinstance(value, bool):
            safe[key] = value
    return safe


def _filter_client_updates(updates: dict[str, Any]) -> dict[str, Any]:
    safe: dict[str, Any] = {}
    for key, value in updates.items():
        if key in ALWAYS_ON_LOGGER_CONFIG_KEYS:
            continue
        if key == "logLevel":
            if isinstance(value, str) and value in VALID_LOG_LEVELS:
                safe[key] = value
            continue
        if key == "api":
            if isinstance(value, bool):
                safe[key] = value
                continue
            if isinstance(value, dict):
                api_updates = {
                    sub_key: sub_value
                    for sub_key, sub_value in value.items()
                    if sub_key in CLIENT_API_SUBCATEGORY_KEYS and isinstance(sub_value, bool)
                }
                if api_updates:
                    safe[key] = api_updates
            continue
        if key in LOGGER_BOOLEAN_KEYS and isinstance(value, bool):
            safe[key] = value
    return safe


def _deep_merge_scope(current: dict[str, Any], updates: dict[str, Any]) -> dict[str, Any]:
    merged = deepcopy(current)
    for key, value in updates.items():
        if key == "api" and isinstance(value, dict) and isinstance(merged.get("api"), dict):
            merged_api = dict(merged.get("api", {}))
            merged_api.update(value)
            merged["api"] = merged_api
            continue
        merged[key] = value
    return merged


def merge_and_persist(
    user_id: str | None,
    updates: dict[str, Any] | None,
) -> dict[str, dict[str, Any]] | None:
    if not isinstance(updates, dict):
        return None

    client_updates = updates.get("client")
    server_updates = updates.get("server")
    client_filtered = (
        _filter_client_updates(client_updates) if isinstance(client_updates, dict) else {}
    )
    server_filtered = (
        _filter_server_updates(server_updates) if isinstance(server_updates, dict) else {}
    )

    if not client_filtered and not server_filtered:
        return None

    row = _get_or_create_row()
    stored = _normalize_stored_config(row.config)

    if client_filtered:
        stored["client"] = _strip_always_on_keys(
            _deep_merge_scope(stored["client"], client_filtered)
        )
    if server_filtered:
        stored["server"] = _strip_always_on_keys(
            _deep_merge_scope(stored["server"], server_filtered)
        )

    row.config = stored
    row.updated_by_user_id = user_id
    db.session.commit()
    resolved = get_resolved_deployment_logger_config()
    if server_filtered:
        from logger import log

        log.update_config(resolved["server"])
    return resolved


def load_server_config_at_startup() -> None:
    from logger import log

    stored = get_stored_deployment_logger_config()
    server_stored = stored.get("server") or {}
    if not server_stored:
        return
    resolved = resolve_server_config(server_stored)
    log.update_config(resolved)
