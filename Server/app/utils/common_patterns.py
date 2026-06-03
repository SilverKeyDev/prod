"""
Common code patterns and utilities to reduce repetition across the application.

Implementation lives under ``app.utils.route`` and ``app.utils.format``; this module
re-exports the public API for backward-compatible imports.
"""

from app.utils.format.safe_json_loads import safe_json_loads
from app.utils.route import (
    api_route,
    configuration_unavailable,
    conflict,
    external_unavailable,
    forbidden,
    handle_exceptions_with_logging,
    invalid_request,
    not_found,
    rate_limited,
    require_agent_access,
    require_authenticated_user,
    require_brokerage_scope,
    require_validated_agent,
    require_validated_user,
    resolve_agent_scoped_user_id,
    server_error,
    standardize_error_response,
    standardize_success_response,
    unauthorized,
    validate_json_request,
    validation,
)

__all__ = [
    "api_route",
    "configuration_unavailable",
    "conflict",
    "external_unavailable",
    "forbidden",
    "handle_exceptions_with_logging",
    "invalid_request",
    "not_found",
    "rate_limited",
    "require_agent_access",
    "require_brokerage_scope",
    "require_authenticated_user",
    "require_validated_agent",
    "require_validated_user",
    "resolve_agent_scoped_user_id",
    "safe_json_loads",
    "server_error",
    "standardize_error_response",
    "standardize_success_response",
    "unauthorized",
    "validate_json_request",
    "validation",
]
