"""
Security utilities module - exports security functions and classes.
This module consolidates security-related functionality.

Re-exports from security.py for backward compatibility.
"""

from .csp import build_content_security_policy
from .rate_limit_backend import rate_limit_storage, storage_lock

# Import everything from security.py to maintain backward compatibility
from .security import (
    SecurityError,
    auth_error_response,
    log_security_event,
    rate_limit,
    safe_user_lookup_error,
    security_error_response,
    validate_required_fields,
)

__all__ = [
    "build_content_security_policy",
    "SecurityError",
    "security_error_response",
    "auth_error_response",
    "rate_limit",
    "log_security_event",
    "safe_user_lookup_error",
    "validate_required_fields",
    "rate_limit_storage",
    "storage_lock",
]
