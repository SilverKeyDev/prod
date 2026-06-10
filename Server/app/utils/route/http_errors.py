"""Named HTTP error responses for Flask routes (ErrorResponse envelope)."""

from __future__ import annotations

from typing import Any

from app.utils.route.response_helpers import standardize_error_response
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import SecurityError, security_error_response


def unauthorized(additional_info: dict[str, Any] | None = None):
    return security_error_response(SecurityError.UNAUTHORIZED, additional_info)


def forbidden(additional_info: dict[str, Any] | None = None):
    return security_error_response(SecurityError.FORBIDDEN, additional_info)


def not_found(message: str | None = None):
    if message:
        return standardize_error_response(
            message,
            status_code=404,
            error_code=SecurityError.RESOURCE_NOT_FOUND[0],
        )
    return security_error_response(SecurityError.RESOURCE_NOT_FOUND)


def validation(
    message: str,
    *,
    field_errors: dict[str, str] | None = None,
    context: dict[str, Any] | None = None,
):
    exc = ValueError(message)
    return SecureErrorHandler.handle_validation_error(
        exc, field_errors=field_errors, context=context
    )


def conflict(message: str, *, error_code: str = "CONFLICT"):
    return standardize_error_response(message, status_code=409, error_code=error_code)


def rate_limited(retry_after: int | None = None):
    additional_info = {"retry_after": retry_after} if retry_after is not None else None
    return security_error_response(SecurityError.RATE_LIMIT_EXCEEDED, additional_info)


def invalid_request(message: str = "Invalid request"):
    return standardize_error_response(
        message,
        status_code=400,
        error_code=SecurityError.INVALID_REQUEST[0],
    )


def server_error(error: Exception, *, context: dict[str, Any] | None = None):
    return SecureErrorHandler.handle_database_error(error, context)


def external_unavailable(
    error: Exception, *, api_name: str | None = None, context: dict[str, Any] | None = None
):
    return SecureErrorHandler.handle_external_api_error(error, api_name=api_name, context=context)


def configuration_unavailable(
    error: Exception | None = None,
    *,
    context: dict[str, Any] | None = None,
):
    if error is None:
        error = RuntimeError("configuration_unavailable")
    return SecureErrorHandler.handle_configuration_error(error, context)
