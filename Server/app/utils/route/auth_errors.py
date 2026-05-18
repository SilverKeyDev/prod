"""Shared auth error handling for route decorators."""

from flask import jsonify, request

from app.services.auth import SecurityException
from app.utils.security import security_error_response
from app.utils.security.app_logging import get_logger
from app.utils.security.secure_errors import SecureErrorHandler

logger = get_logger()


def parse_security_exception_tuple(exc: SecurityException) -> tuple | list | None:
    if exc.args and isinstance(exc.args[0], tuple | list) and len(exc.args[0]) >= 3:
        return exc.args[0]
    return None


def security_exception_response(exc: SecurityException, *, route_name: str):
    err = parse_security_exception_tuple(exc)
    logger.warning(
        "Unauthorized request to %s: %s",
        route_name,
        err[1] if err else "authentication required",
    )
    if err:
        return security_error_response(err)
    return jsonify({"success": False, "error": "Authentication required"}), 401


def unexpected_auth_error_response(
    exc: Exception,
    *,
    route_name: str,
    log_prefix: str = "Authentication error",
):
    logger.error("%s in %s: %s", log_prefix, route_name, str(exc))
    return SecureErrorHandler.handle_database_error(
        exc, {"function": route_name, "endpoint": request.endpoint}
    )
