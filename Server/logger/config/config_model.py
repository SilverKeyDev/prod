"""AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.

Modify scripts/log_contracts/categories.yaml, then run: make log-contracts
"""

from typing import Any

LogLevel = str  # "DEBUG" | "INFO" | "WARN" | "ERROR"

LOG_LEVELS: dict[LogLevel, int] = {
    "DEBUG": 0,
    "INFO": 1,
    "WARN": 2,
    "ERROR": 3,
}


class LoggerConfig:
    """Logger configuration dataclass."""

    def __init__(self, config_dict: dict[str, Any]):
        self.polling: bool = config_dict.get("polling", False)
        self.pages: bool = config_dict.get("pages", False)
        self.hooks: bool = config_dict.get("hooks", False)
        self.auth: bool = config_dict.get("auth", False)
        self.http: bool = config_dict.get("http", False)
        self.api: bool = config_dict.get("api", False)
        self.errors: bool = config_dict.get("errors", True)
        self.security: bool = config_dict.get("security", True)
        self.search: bool = config_dict.get("search", False)
        self.polygonSearch: bool = config_dict.get("polygonSearch", False)
        self.mapRendering: bool = config_dict.get("mapRendering", False)
        self.propertyDetails: bool = config_dict.get("propertyDetails", False)
        self.negotiation: bool = config_dict.get("negotiation", False)
        self.checklists: bool = config_dict.get("checklists", False)
        self.calendar: bool = config_dict.get("calendar", False)
        self.dashboard: bool = config_dict.get("dashboard", False)
        self.messages: bool = config_dict.get("messages", False)
        self.feed: bool = config_dict.get("feed", False)
        self.routing: bool = config_dict.get("routing", False)
        self.docusign: bool = config_dict.get("docusign", False)
        self.documents: bool = config_dict.get("documents", False)
        self.profilePreferences: bool = config_dict.get("profilePreferences", False)
        self.logLevel: LogLevel = config_dict.get("logLevel", "ERROR")

    def to_dict(self) -> dict[str, Any]:
        return {
            "polling": self.polling,
            "pages": self.pages,
            "hooks": self.hooks,
            "auth": self.auth,
            "http": self.http,
            "api": self.api,
            "errors": self.errors,
            "security": self.security,
            "search": self.search,
            "polygonSearch": self.polygonSearch,
            "mapRendering": self.mapRendering,
            "propertyDetails": self.propertyDetails,
            "negotiation": self.negotiation,
            "checklists": self.checklists,
            "calendar": self.calendar,
            "dashboard": self.dashboard,
            "messages": self.messages,
            "feed": self.feed,
            "routing": self.routing,
            "docusign": self.docusign,
            "documents": self.documents,
            "profilePreferences": self.profilePreferences,
            "logLevel": self.logLevel,
        }

    def update(self, updates: dict[str, Any]) -> None:
        for key, value in updates.items():
            if hasattr(self, key):
                setattr(self, key, value)
