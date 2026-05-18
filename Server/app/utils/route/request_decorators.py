"""JSON request validation decorators."""

from functools import wraps

from flask import jsonify, request

from app.utils.security.app_logging import get_logger

logger = get_logger()


def validate_json_request(required_fields=None):
    """
    Decorator that validates JSON request data and required fields.
    Eliminates repeated JSON validation patterns.

    Args:
        required_fields: List of required field names
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if request has JSON data
            if not request.is_json:
                logger.warning(f"🚫 Non-JSON request to {f.__name__}")
                return jsonify(
                    {"error": "Content-Type must be application/json", "success": False}
                ), 400

            data = request.get_json()
            if not data:
                logger.warning(f"🚫 Empty JSON data in request to {f.__name__}")
                return jsonify({"error": "No data provided", "success": False}), 400

            # Validate required fields
            if required_fields:
                missing_fields = [field for field in required_fields if not data.get(field)]
                if missing_fields:
                    logger.warning(f"🚫 Missing required fields in {f.__name__}: {missing_fields}")
                    return jsonify(
                        {
                            "error": f"Missing required fields: {', '.join(missing_fields)}",
                            "success": False,
                        }
                    ), 400

            # Pass data as first argument to the decorated function
            return f(data, *args, **kwargs)

        return decorated_function

    return decorator
