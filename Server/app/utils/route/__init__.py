"""Flask route decorators, response helpers, and agent scoping utilities."""

from app.utils.route.agent_scope import resolve_agent_scoped_user_id
from app.utils.route.auth_decorators import (
    require_agent_access,
    require_authenticated_user,
    require_brokerage_scope,
)
from app.utils.route.composite import api_route
from app.utils.route.exception_decorators import handle_exceptions_with_logging
from app.utils.route.http_errors import (
    configuration_unavailable,
    conflict,
    external_unavailable,
    forbidden,
    invalid_request,
    not_found,
    rate_limited,
    server_error,
    unauthorized,
    validation,
)
from app.utils.route.openapi_auth import require_validated_agent, require_validated_user
from app.utils.route.request_decorators import validate_json_request
from app.utils.route.response_helpers import (
    standardize_error_response,
    standardize_success_response,
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
    "server_error",
    "unauthorized",
    "validation",
    "require_agent_access",
    "require_brokerage_scope",
    "require_authenticated_user",
    "require_validated_agent",
    "require_validated_user",
    "resolve_agent_scoped_user_id",
    "standardize_error_response",
    "standardize_success_response",
    "validate_json_request",
]
