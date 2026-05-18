"""Route exception handling decorators."""

from functools import wraps

from flask import jsonify, request

from app.utils.security.secure_errors import SecureErrorHandler
from logger import LOG_CATEGORIES, log


def handle_exceptions_with_logging(f):
    """
    Decorator that provides consistent exception handling and logging.
    Eliminates repeated try/except patterns.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            log.warn(
                LOG_CATEGORIES["ERRORS"],
                "Validation error in decorated handler",
                {"function": f.__name__, "error": str(e)},
            )
            # User-facing validation messages are safe; avoid leaking internal details
            return jsonify({"error": str(e), "success": False}), 400
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Unexpected error in decorated handler",
                {"function": f.__name__, "endpoint": request.endpoint, "error": str(e)},
            )
            return SecureErrorHandler.handle_database_error(
                e, {"function": f.__name__, "endpoint": request.endpoint}
            )

    return decorated_function
