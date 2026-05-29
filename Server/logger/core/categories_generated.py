"""AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.

Modify scripts/log-contracts/categories.yaml, then run: make log-contracts
"""

from enum import Enum

try:
    from enum import StrEnum
except ImportError:

    class StrEnum(str, Enum):  # noqa: UP042
        """StrEnum fallback for Python < 3.11."""

        pass


class LogCategory(StrEnum):
    """Log category enumeration matching frontend categories."""

    POLLING = "POLLING"
    PAGES = "PAGES"
    HOOKS = "HOOKS"
    AUTH = "AUTH"
    HTTP = "HTTP"
    API = "API"
    ERRORS = "ERRORS"
    SECURITY = "SECURITY"
    SEARCH = "SEARCH"
    POLYGON_SEARCH = "POLYGON_SEARCH"
    MAP_RENDERING = "MAP_RENDERING"
    PROPERTY_DETAILS = "PROPERTY_DETAILS"
    NEGOTIATION = "NEGOTIATION"
    CHECKLISTS = "CHECKLISTS"
    CALENDAR = "CALENDAR"
    DASHBOARD = "DASHBOARD"
    MESSAGES = "MESSAGES"
    FEED = "FEED"
    ROUTING = "ROUTING"
    DOCUSIGN = "DOCUSIGN"
    DOCUMENTS = "DOCUMENTS"
    PROFILE_PREFERENCES = "PROFILE_PREFERENCES"


LOG_CATEGORIES: dict[str, LogCategory] = {
    "POLLING": LogCategory.POLLING,
    "PAGES": LogCategory.PAGES,
    "HOOKS": LogCategory.HOOKS,
    "AUTH": LogCategory.AUTH,
    "HTTP": LogCategory.HTTP,
    "API": LogCategory.API,
    "ERRORS": LogCategory.ERRORS,
    "SECURITY": LogCategory.SECURITY,
    "SEARCH": LogCategory.SEARCH,
    "POLYGON_SEARCH": LogCategory.POLYGON_SEARCH,
    "MAP_RENDERING": LogCategory.MAP_RENDERING,
    "PROPERTY_DETAILS": LogCategory.PROPERTY_DETAILS,
    "NEGOTIATION": LogCategory.NEGOTIATION,
    "CHECKLISTS": LogCategory.CHECKLISTS,
    "CALENDAR": LogCategory.CALENDAR,
    "DASHBOARD": LogCategory.DASHBOARD,
    "MESSAGES": LogCategory.MESSAGES,
    "FEED": LogCategory.FEED,
    "ROUTING": LogCategory.ROUTING,
    "DOCUSIGN": LogCategory.DOCUSIGN,
    "DOCUMENTS": LogCategory.DOCUMENTS,
    "PROFILE_PREFERENCES": LogCategory.PROFILE_PREFERENCES,
}

LOG_PATHS: tuple[str, ...] = (
    "POLLING",
    "PAGES",
    "HOOKS",
    "AUTH",
    "HTTP",
    "API",
    "API.INITIAL_LOAD",
    "API.POLLING",
    "API.PAGE_MOUNT",
    "API.OTHER",
    "ERRORS",
    "SECURITY",
    "SEARCH",
    "POLYGON_SEARCH",
    "MAP_RENDERING",
    "PROPERTY_DETAILS",
    "NEGOTIATION",
    "CHECKLISTS",
    "CALENDAR",
    "DASHBOARD",
    "MESSAGES",
    "FEED",
    "ROUTING",
    "DOCUSIGN",
    "DOCUMENTS",
    "PROFILE_PREFERENCES",
)


def category_to_config_key(category: LogCategory) -> str:
    mapping: dict[LogCategory, str] = {
        LogCategory.POLLING: "polling",
        LogCategory.PAGES: "pages",
        LogCategory.HOOKS: "hooks",
        LogCategory.AUTH: "auth",
        LogCategory.HTTP: "http",
        LogCategory.API: "api",
        LogCategory.ERRORS: "errors",
        LogCategory.SECURITY: "security",
        LogCategory.SEARCH: "search",
        LogCategory.POLYGON_SEARCH: "polygonSearch",
        LogCategory.MAP_RENDERING: "mapRendering",
        LogCategory.PROPERTY_DETAILS: "propertyDetails",
        LogCategory.NEGOTIATION: "negotiation",
        LogCategory.CHECKLISTS: "checklists",
        LogCategory.CALENDAR: "calendar",
        LogCategory.DASHBOARD: "dashboard",
        LogCategory.MESSAGES: "messages",
        LogCategory.FEED: "feed",
        LogCategory.ROUTING: "routing",
        LogCategory.DOCUSIGN: "docusign",
        LogCategory.DOCUMENTS: "documents",
        LogCategory.PROFILE_PREFERENCES: "profilePreferences",
    }
    return mapping[category]


def is_always_enabled(category: LogCategory) -> bool:
    return category in (LogCategory.ERRORS, LogCategory.SECURITY)


ALWAYS_ENABLED_CATEGORIES: frozenset[LogCategory] = frozenset(
    (LogCategory.ERRORS, LogCategory.SECURITY)
)
