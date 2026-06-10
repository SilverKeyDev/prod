"""
Security utilities module - exports security functions and classes.

Canonical locations (Wave 4):
- HTTP errors / CSP: ``app.http.secure_errors``, ``app.http.csp``
- Upload validation: ``app.services.documents.file_security``
- Env key checks: ``app.config.env_validator``

This package re-exports moved symbols for one release.
"""

from app.config.env_validator import FlexibleEnvValidator, check_api_keys
from app.http.csp import build_content_security_policy
from app.http.secure_errors import SecureErrorHandler
from app.services.documents.file_security import (
    FileSecurityError,
    validate_file_upload,
)

from .rate_limit_backend import rate_limit_storage, storage_lock
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
    "FlexibleEnvValidator",
    "FileSecurityError",
    "SecureErrorHandler",
    "SecurityError",
    "auth_error_response",
    "build_content_security_policy",
    "check_api_keys",
    "log_security_event",
    "rate_limit",
    "rate_limit_storage",
    "safe_user_lookup_error",
    "security_error_response",
    "storage_lock",
    "validate_file_upload",
    "validate_required_fields",
]
