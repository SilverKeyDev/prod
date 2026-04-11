"""
Logger Category Definitions
Type-safe category constants and helpers
"""

from enum import Enum

try:
    from enum import StrEnum
except ImportError:
    # StrEnum added in Python 3.11; provide fallback for 3.10 (noqa: intentional)
    class StrEnum(str, Enum):  # noqa: UP042
        """StrEnum fallback for Python < 3.11"""

        pass


class LogCategory(StrEnum):
    """Log category enumeration matching frontend categories"""

    POLLING = "POLLING"
    PAGES = "PAGES"
    HOOKS = "HOOKS"
    AUTH = "AUTH"
    HTTP = "HTTP"
    API = "API"
    ERRORS = "ERRORS"
    SECURITY = "SECURITY"
    POLYGON_SEARCH = "POLYGON_SEARCH"
    DOCUSIGN = "DOCUSIGN"


# Constant dict for easy access
LOG_CATEGORIES: dict[str, LogCategory] = {
    "POLLING": LogCategory.POLLING,
    "PAGES": LogCategory.PAGES,
    "HOOKS": LogCategory.HOOKS,
    "AUTH": LogCategory.AUTH,
    "HTTP": LogCategory.HTTP,
    "API": LogCategory.API,
    "ERRORS": LogCategory.ERRORS,
    "SECURITY": LogCategory.SECURITY,
    "POLYGON_SEARCH": LogCategory.POLYGON_SEARCH,
    "DOCUSIGN": LogCategory.DOCUSIGN,
}


def category_to_config_key(category: LogCategory) -> str:
    """
    Map category to config key (camelCase format)

    Args:
        category: Log category enum

    Returns:
        Config key string (e.g., "pages")
    """
    mapping: dict[LogCategory, str] = {
        LogCategory.POLLING: "polling",
        LogCategory.PAGES: "pages",
        LogCategory.HOOKS: "hooks",
        LogCategory.AUTH: "auth",
        LogCategory.HTTP: "http",
        LogCategory.API: "api",
        LogCategory.ERRORS: "errors",
        LogCategory.SECURITY: "security",
        LogCategory.POLYGON_SEARCH: "polygonSearch",
        LogCategory.DOCUSIGN: "docusign",
    }
    return mapping[category]


def is_always_enabled(category: LogCategory) -> bool:
    """
    Check if a category should always be enabled (errors and security)

    Args:
        category: Log category enum

    Returns:
        True if category is always enabled
    """
    return category in (LogCategory.ERRORS, LogCategory.SECURITY)
