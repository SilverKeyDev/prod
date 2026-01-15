"""
Centralized Logger with Category-Based Filtering
Supports runtime config reloading and PII scrubbing
"""
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional, Union
from pathlib import Path

from .categories import LogCategory, category_to_config_key, is_always_enabled
from .pii import create_safe_log_object, mask_sensitive_data


LogLevel = str  # "DEBUG" | "INFO" | "WARN" | "ERROR"

LOG_LEVELS: Dict[LogLevel, int] = {
    "DEBUG": 0,
    "INFO": 1,
    "WARN": 2,
    "ERROR": 3,
}


class LoggerConfig:
    """Logger configuration dataclass"""
    def __init__(self, config_dict: Dict[str, Any]):
        self.polling: bool = config_dict.get("polling", True)
        self.pages: bool = config_dict.get("pages", True)
        self.hooks: bool = config_dict.get("hooks", True)
        self.auth: bool = config_dict.get("auth", True)
        self.http: bool = config_dict.get("http", True)
        self.api: bool = config_dict.get("api", True)
        self.errors: bool = config_dict.get("errors", True)
        self.security: bool = config_dict.get("security", True)
        self.logLevel: LogLevel = config_dict.get("logLevel", "DEBUG")
    
    def to_dict(self) -> Dict[str, Any]:
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
            "logLevel": self.logLevel,
        }
    
    def update(self, updates: Dict[str, Any]) -> None:
        """Update config with new values"""
        for key, value in updates.items():
            if hasattr(self, key):
                setattr(self, key, value)


class Logger:
    """Centralized logger with category-based filtering and PII scrubbing"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize logger
        
        Args:
            config_path: Path to logger_config.json file. If None, uses default location.
        """
        # Determine config file path
        if config_path is None:
            # Default to Server/logger/logger_config.json
            base_dir = Path(__file__).parent.parent
            config_path = str(base_dir / "logger" / "logger_config.json")
        
        self.config_path = config_path
        self.config = self._load_config()
        self.is_processing = False
        
        # Set up Python logging
        self._setup_python_logging()
    
    def _setup_python_logging(self) -> None:
        """Set up Python logging module"""
        # Get or create logger
        self._py_logger = logging.getLogger("app.logger")
        
        # Set level based on config
        level_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARN": logging.WARNING,
            "ERROR": logging.ERROR,
        }
        self._py_logger.setLevel(level_map.get(self.config.logLevel, logging.DEBUG))
        
        # Add handler if none exists
        if not self._py_logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(
                logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            )
            self._py_logger.addHandler(handler)
    
    def _load_config(self) -> LoggerConfig:
        """
        Load config from JSON file
        
        Returns:
            LoggerConfig instance
        """
        default_config = {
            "polling": True,
            "pages": True,
            "hooks": True,
            "auth": True,
            "http": True,
            "api": True,
            "errors": True,
            "security": True,
            "logLevel": "DEBUG",
        }
        
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    config_dict = json.load(f)
                    # Merge with defaults
                    default_config.update(config_dict)
        except Exception:
            # If config file doesn't exist or can't be loaded, use defaults
            pass
        
        return LoggerConfig(default_config)
    
    def reload_config(self) -> None:
        """Reload config from file"""
        try:
            self.config = self._load_config()
            self._setup_python_logging()
        except Exception as e:
            self._py_logger.warning(f"[Logger] Failed to reload config: {e}")
    
    def update_config(self, updates: Dict[str, Any]) -> None:
        """
        Update config programmatically (for runtime toggling)
        
        Args:
            updates: Dictionary of config updates
        """
        self.config.update(updates)
        self._setup_python_logging()
    
    def get_config(self) -> Dict[str, Any]:
        """
        Get current config (read-only copy)
        
        Returns:
            Dictionary copy of current config
        """
        return self.config.to_dict()
    
    def _is_category_enabled(self, category: LogCategory) -> bool:
        """
        Check if a category is enabled
        
        Args:
            category: Log category
            
        Returns:
            True if category is enabled
        """
        if is_always_enabled(category):
            return True
        
        config_key = category_to_config_key(category)
        return getattr(self.config, config_key, True)
    
    def _is_level_enabled(self, level: LogLevel) -> bool:
        """
        Check if log level is enabled
        
        Args:
            level: Log level to check
            
        Returns:
            True if level is enabled
        """
        current_level = LOG_LEVELS.get(self.config.logLevel, 0)
        message_level = LOG_LEVELS.get(level, 0)
        return message_level >= current_level
    
    def _format_message(
        self,
        level: LogLevel,
        category: LogCategory,
        message: str,
        data: Optional[Any] = None,
    ) -> str:
        """
        Format log message with timestamp and category
        
        Args:
            level: Log level
            category: Log category
            message: Log message
            data: Optional data to include
            
        Returns:
            Formatted log message
        """
        if self.is_processing:
            timestamp = datetime.utcnow().isoformat()
            return f"[{timestamp}] [{level}] [{category.value}] {message} [RECURSION_PREVENTED]"
        
        try:
            self.is_processing = True
            timestamp = datetime.utcnow().isoformat()
            prefix = f"[{timestamp}] [{level}] [{category.value}]"
            
            # Mask sensitive data in message
            safe_message = mask_sensitive_data(message)
            
            if data is not None:
                scrubbed_data = create_safe_log_object(data)
                data_str = json.dumps(scrubbed_data, default=str)
                return f"{prefix} {safe_message} {data_str}"
            
            return f"{prefix} {safe_message}"
        except Exception:
            timestamp = datetime.utcnow().isoformat()
            return f"[{timestamp}] [{level}] [{category.value}] {message} [FORMAT_ERROR]"
        finally:
            self.is_processing = False
    
    def debug(self, category: LogCategory, message: str, data: Optional[Any] = None) -> None:
        """
        Debug logging
        
        Args:
            category: Log category
            message: Log message
            data: Optional data to include
        """
        if not self._is_category_enabled(category) or not self._is_level_enabled("DEBUG"):
            return
        
        try:
            formatted = self._format_message("DEBUG", category, message, data)
            self._py_logger.debug(formatted)
        except Exception as e:
            self._py_logger.error(f"[Logger] Debug error: {e}")
    
    def info(self, category: LogCategory, message: str, data: Optional[Any] = None) -> None:
        """
        Info logging
        
        Args:
            category: Log category
            message: Log message
            data: Optional data to include
        """
        if not self._is_category_enabled(category) or not self._is_level_enabled("INFO"):
            return
        
        try:
            formatted = self._format_message("INFO", category, message, data)
            self._py_logger.info(formatted)
        except Exception as e:
            self._py_logger.error(f"[Logger] Info error: {e}")
    
    def warn(self, category: LogCategory, message: str, data: Optional[Any] = None) -> None:
        """
        Warning logging
        
        Args:
            category: Log category
            message: Log message
            data: Optional data to include
        """
        if not self._is_category_enabled(category) or not self._is_level_enabled("WARN"):
            return
        
        try:
            formatted = self._format_message("WARN", category, message, data)
            self._py_logger.warning(formatted)
        except Exception as e:
            self._py_logger.error(f"[Logger] Warn error: {e}")
    
    def error(self, category: LogCategory, message: str, error: Optional[Union[Exception, Any]] = None) -> None:
        """
        Error logging
        
        Args:
            category: Log category
            message: Log message
            error: Optional error object or data
        """
        if not self._is_category_enabled(category) or not self._is_level_enabled("ERROR"):
            return
        
        try:
            error_data = error
            
            # Handle Exception objects
            if isinstance(error, Exception):
                error_data = {
                    "name": type(error).__name__,
                    "message": str(error),
                    "stack": None,
                }
                # Try to get traceback if available
                import traceback
                try:
                    error_data["stack"] = traceback.format_exc()
                except Exception:
                    pass
            
            formatted = self._format_message("ERROR", category, message, error_data)
            self._py_logger.error(formatted)
        except Exception as e:
            self._py_logger.error(f"[Logger] Error logging error: {e}")
    
    def security(self, category: LogCategory, event: str, data: Optional[Any] = None) -> None:
        """
        Security event logging (always logs)
        
        Args:
            category: Log category
            event: Security event message
            data: Optional data to include
        """
        try:
            scrubbed_data = create_safe_log_object(data) if data else None
            formatted = self._format_message("SECURITY", category, f"🔒 {event}", scrubbed_data)
            self._py_logger.warning(formatted)
        except Exception as e:
            self._py_logger.error(f"[Logger] Security logging error: {e}")


# Export singleton instance
_logger_instance: Optional[Logger] = None


def get_logger() -> Logger:
    """Get or create singleton logger instance"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    return _logger_instance


# Convenience exports
logger = get_logger()


class LogProxy:
    """Convenience proxy for logger instance"""
    
    def debug(self, category: LogCategory, message: str, data: Optional[Any] = None) -> None:
        logger.debug(category, message, data)
    
    def info(self, category: LogCategory, message: str, data: Optional[Any] = None) -> None:
        logger.info(category, message, data)
    
    def warn(self, category: LogCategory, message: str, data: Optional[Any] = None) -> None:
        logger.warn(category, message, data)
    
    def error(self, category: LogCategory, message: str, error: Optional[Union[Exception, Any]] = None) -> None:
        logger.error(category, message, error)
    
    def security(self, category: LogCategory, event: str, data: Optional[Any] = None) -> None:
        logger.security(category, event, data)
    
    def reload_config(self) -> None:
        logger.reload_config()
    
    def update_config(self, updates: Dict[str, Any]) -> None:
        logger.update_config(updates)
    
    def get_config(self) -> Dict[str, Any]:
        return logger.get_config()


log = LogProxy()
