"""Logger configuration types and defaults (split from logger.py for maintainability)."""

from typing import Any

LogLevel = str  # "DEBUG" | "INFO" | "WARN" | "ERROR"

LOG_LEVELS: dict[LogLevel, int] = {
    "DEBUG": 0,
    "INFO": 1,
    "WARN": 2,
    "ERROR": 3,
}


class LoggerConfig:
    """Logger configuration dataclass"""

    def __init__(self, config_dict: dict[str, Any]):
        self.polling: bool = config_dict.get("polling", True)
        self.pages: bool = config_dict.get("pages", True)
        self.hooks: bool = config_dict.get("hooks", True)
        self.auth: bool = config_dict.get("auth", True)
        self.http: bool = config_dict.get("http", True)
        self.api: bool = config_dict.get("api", True)
        self.errors: bool = config_dict.get("errors", True)
        self.security: bool = config_dict.get("security", True)
        self.polygonSearch: bool = config_dict.get("polygonSearch", True)
        self.docusign: bool = config_dict.get("docusign", True)
        self.documents: bool = config_dict.get("documents", True)
        self.profilePreferences: bool = config_dict.get("profilePreferences", True)
        self.logLevel: LogLevel = config_dict.get("logLevel", "DEBUG")

    def to_dict(self) -> dict[str, Any]:
        """Convert config to dictionary"""
        return {
            "polling": self.polling,
            "pages": self.pages,
            "hooks": self.hooks,
            "auth": self.auth,
            "http": self.http,
            "api": self.api,
            "errors": self.errors,
            "security": self.security,
            "polygonSearch": self.polygonSearch,
            "docusign": self.docusign,
            "documents": self.documents,
            "profilePreferences": self.profilePreferences,
            "logLevel": self.logLevel,
        }

    def update(self, updates: dict[str, Any]) -> None:
        """Update config with new values"""
        for key, value in updates.items():
            if hasattr(self, key):
                setattr(self, key, value)
