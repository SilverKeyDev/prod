"""
Centralized logging configuration and utilities for the entire application.
"""
import logging
import sys
from typing import Optional
from flask import current_app, has_app_context

# Global logger cache to avoid repeated instantiation
_logger_cache = {}

def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance with automatic name detection and caching.
    
    Args:
        name: Logger name. If None, automatically detects from calling module.
        
    Returns:
        Configured logger instance
    """
    if name is None:
        # Auto-detect calling module name
        frame = sys._getframe(1)
        name = frame.f_globals.get('__name__', 'app')
    
    # Return cached logger if available
    if name in _logger_cache:
        return _logger_cache[name]
    
    # Create and configure logger
    if has_app_context() and name == 'app':
        logger = current_app.logger
    else:
        logger = logging.getLogger(name)
    
    # Cache the logger
    _logger_cache[name] = logger
    return logger

def configure_app_logging(app):
    """
    Configure logging for the entire application.
    Call this once during app initialization.
    """
    # Set up root logger configuration
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Configure Flask app logger
    app.logger.setLevel(logging.INFO)
    
    # Silence verbose third-party libraries
    verbose_loggers = [
        'botocore', 'boto3', 'urllib3', 's3transfer', 'matplotlib',
        'celery', 'werkzeug', 'openai', 'httpx', 'httpcore',
        'requests.packages.urllib3', 'PIL'
    ]
    
    for logger_name in verbose_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)
    
    # Set application loggers to appropriate levels
    app_loggers = {
        'app.routes': logging.INFO,
        'app.services': logging.INFO,
        'app.models': logging.WARNING,
        'app.utils': logging.INFO,
        'app.celery': logging.INFO
    }
    
    for logger_name, level in app_loggers.items():
        logging.getLogger(logger_name).setLevel(level)
    
# Convenience function for common logging patterns
def log_user_action(action: str, user_id: str, details: dict = None):
    """Log user actions with consistent formatting."""
    logger = get_logger()
    details_str = f" - {details}" if details else ""
    logger.info(f"👤 User {user_id}: {action}{details_str}")

def log_api_call(endpoint: str, method: str, status_code: int, duration_ms: float = None):
    """Log API calls with consistent formatting."""
    logger = get_logger()
    duration_str = f" ({duration_ms:.2f}ms)" if duration_ms else ""
    status_emoji = "✅" if 200 <= status_code < 300 else "⚠️" if 400 <= status_code < 500 else "❌"
    logger.info(f"{status_emoji} {method} {endpoint} - {status_code}{duration_str}")

def log_error_with_context(error: Exception, context: dict = None):
    """Log errors with additional context."""
    logger = get_logger()
    context_str = f" Context: {context}" if context else ""
    logger.error(f"❌ {type(error).__name__}: {str(error)}{context_str}")

def log_performance(operation: str, duration_ms: float, threshold_ms: float = 1000):
    """Log performance metrics with warnings for slow operations."""
    logger = get_logger()
    emoji = "🐌" if duration_ms > threshold_ms else "⚡"
    logger.info(f"{emoji} {operation} completed in {duration_ms:.2f}ms")
    
    if duration_ms > threshold_ms:
        logger.warning(f"⚠️ Slow operation detected: {operation} took {duration_ms:.2f}ms")
