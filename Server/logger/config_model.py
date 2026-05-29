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
        self.polling: bool = config_dict.get("polling", False)
        self.pages: bool = config_dict.get("pages", False)
        self.hooks: bool = config_dict.get("hooks", False)
        self.auth: bool = config_dict.get("auth", False)
        self.http: bool = config_dict.get("http", False)
        self.api: bool = config_dict.get("api", False)
        self.errors: bool = config_dict.get("errors", True)
        self.security: bool = config_dict.get("security", True)
        self.polygonSearch: bool = config_dict.get("polygonSearch", False)
        self.docusign: bool = config_dict.get("docusign", False)
        self.documents: bool = config_dict.get("documents", False)
        self.profilePreferences: bool = config_dict.get("profilePreferences", False)
        self.logLevel: LogLevel = config_dict.get("logLevel", "ERROR")

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
