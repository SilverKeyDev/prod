"""AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.

Modify scripts/log-contracts/categories.yaml, then run: make log-contracts
"""

from typing import Any

LOGGER_BOOLEAN_KEYS: tuple[str, ...] = (
    "polling",
    "pages",
    "hooks",
    "auth",
    "http",
    "errors",
    "security",
    "search",
    "polygonSearch",
    "mapRendering",
    "propertyDetails",
    "negotiation",
    "checklists",
    "calendar",
    "dashboard",
    "messages",
    "feed",
    "routing",
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
        "search": bool_value,
        "polygonSearch": bool_value,
        "mapRendering": bool_value,
        "propertyDetails": bool_value,
        "negotiation": bool_value,
        "checklists": bool_value,
        "calendar": bool_value,
        "dashboard": bool_value,
        "messages": bool_value,
        "feed": bool_value,
        "routing": bool_value,
        "docusign": bool_value,
        "documents": bool_value,
        "profilePreferences": bool_value,
        "logLevel": "INFO" if is_prod else "ERROR",
    }
