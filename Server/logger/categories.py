"""
Logger Category Definitions
Type-safe category constants and helpers
"""
from enum import Enum
from typing import Dict


class LogCategory(str, Enum):
    """Log category enumeration matching frontend categories"""
    POLLING = "POLLING"
    PAGES = "PAGES"
    HOOKS = "HOOKS"
    AUTH = "AUTH"
    HTTP = "HTTP"
    API = "API"
    ERRORS = "ERRORS"
    SECURITY = "SECURITY"


# Constant dict for easy access
LOG_CATEGORIES: Dict[str, LogCategory] = {
    "POLLING": LogCategory.POLLING,
    "PAGES": LogCategory.PAGES,
    "HOOKS": LogCategory.HOOKS,
    "AUTH": LogCategory.AUTH,
    "HTTP": LogCategory.HTTP,
    "API": LogCategory.API,
    "ERRORS": LogCategory.ERRORS,
    "SECURITY": LogCategory.SECURITY,
}


def category_to_config_key(category: LogCategory) -> str:
    """
    Map category to config key (camelCase format)
    
    Args:
        category: Log category enum
        
    Returns:
        Config key string (e.g., "pages")
    """
    mapping: Dict[LogCategory, str] = {
        LogCategory.POLLING: "polling",
        LogCategory.PAGES: "pages",
        LogCategory.HOOKS: "hooks",
        LogCategory.AUTH: "auth",
        LogCategory.HTTP: "http",
        LogCategory.API: "api",
        LogCategory.ERRORS: "errors",
        LogCategory.SECURITY: "security",
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
