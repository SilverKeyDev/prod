"""
Common code patterns and utilities to reduce repetition across the application.
"""

import json
from functools import wraps

from flask import jsonify, request

from app.services.auth import SecurityException, get_current_user
from app.utils.security.app_logging import get_logger
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import security_error_response
from logger import LOG_CATEGORIES, log

logger = get_logger()


def resolve_agent_scoped_user_id(user, json_body: dict | None = None):
    """
    Resolve which user's favorites/documents to read or mutate.

    Optional ``client_id`` may be supplied as a query param (e.g. GET) or in
    ``json_body`` (e.g. POST). Non-agents cannot pass ``client_id``. Agents may
    only use IDs present in their ``client_ids`` roster.

    Returns:
        (target_user_id, None) on success, or
        (None, (jsonify_response, http_status)) on authorization / validation error.
    """
    cid = request.args.get("client_id")
    if cid is not None and isinstance(cid, str):
        cid = cid.strip()
    if not cid:
        cid = None
    if cid is None and isinstance(json_body, dict):
        raw = json_body.get("client_id")
        if raw is not None and str(raw).strip():
            cid = str(raw).strip()

    if not cid:
        return str(user.id), None

    if not getattr(user, "is_agent", False):
        return None, (
            jsonify({"success": False, "error": "Only agents can act on behalf of another user"}),
            403,
        )

    client_ids = safe_json_loads(user.client_ids, default=[])
    if not isinstance(client_ids, list):
        client_ids = []
    allowed = {str(x) for x in client_ids}
    cid_s = str(cid)
    if cid_s not in allowed:
        return None, (
            jsonify({"success": False, "error": "Client not assigned to this agent"}),
            403,
        )

    return cid_s, None


def safe_json_loads(value, default=None):
    """
    Safely parse JSON string or return default value.
    Handles string parsing, type checking, and error cases.

    Args:
        value: Value to parse (string, dict, list, or None)
        default: Default value to return if parsing fails or value is None/empty

    Returns:
        Parsed JSON value or default
    """
    if not value:
        return default

    # If already a dict or list, return as-is
    if isinstance(value, dict | list):
        return value

    # If not a string, return default
    if not isinstance(value, str):
        return default

    # Try to parse JSON string
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError, ValueError):
        return default


def require_authenticated_user(f):
    """
    Decorator that handles user authentication and returns standardized error responses.
    Eliminates the repeated pattern of get_current_user() + error handling.
    Auth failures (SecurityException) return 401 without logging tracebacks.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user = get_current_user()
            if not user:
                logger.warning("Unauthorized request to %s: user not found in token", f.__name__)
                return jsonify({"error": "Unauthorized", "success": False}), 401

            # Pass user as first argument to the decorated function
            return f(user, *args, **kwargs)

        except SecurityException as e:
            # Auth failures are expected; return 401 without full traceback
            err = (
                e.args[0]
                if e.args and isinstance(e.args[0], tuple | list) and len(e.args[0]) >= 3
                else None
            )
            logger.warning(
                "Unauthorized request to %s: %s",
                f.__name__,
                err[1] if err else "authentication required",
            )
            if err:
                return security_error_response(err)
            return jsonify({"success": False, "error": "Authentication required"}), 401

        except Exception as e:
            logger.error("Authentication error in %s: %s", f.__name__, str(e))
            return SecureErrorHandler.handle_database_error(
                e, {"function": f.__name__, "endpoint": request.endpoint}
            )

    return decorated_function


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


def require_agent_access(f):
    """
    Decorator that ensures the user is an agent and has access to the specified client.
    Eliminates repeated agent authorization patterns.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get the current authenticated user
            user = get_current_user()
            if not user:
                logger.warning(f"🚫 Unauthorized request to {f.__name__}: user not found in token")
                return jsonify({"error": "Unauthorized", "success": False}), 401

            # Check if user is an agent
            if not user.is_agent:
                logger.warning(
                    f"🚫 Non-agent user {user.id} attempted to access agent endpoint {f.__name__}"
                )
                return jsonify(
                    {"error": "Only agents can access this endpoint", "success": False}
                ), 403

            # If there's a target_user_id in the request, validate agent has access
            # Use silent=True to avoid raising exceptions on empty/invalid JSON
            data = request.get_json(silent=True) or {}
            # Also check query parameters for GET requests
            target_user_id = (
                data.get("user_id")
                or data.get("target_user_id")
                or request.args.get("user_id")
                or request.args.get("target_user_id")
            )

            if target_user_id:
                try:
                    client_ids = safe_json_loads(user.client_ids, default=[])

                    if target_user_id not in client_ids:
                        logger.warning(
                            f"🚫 Agent {user.id} attempted to access client {target_user_id} not in their list"
                        )
                        return jsonify(
                            {"error": "Access denied: User is not your client", "success": False}
                        ), 403

                except (json.JSONDecodeError, TypeError) as e:
                    logger.error(f"❌ Failed to parse agent's client_ids: {str(e)}")
                    return jsonify(
                        {"error": "Invalid agent client configuration", "success": False}
                    ), 500

            # Pass user as first argument to the decorated function
            return f(user, *args, **kwargs)

        except SecurityException as e:
            err = (
                e.args[0]
                if e.args and isinstance(e.args[0], tuple | list) and len(e.args[0]) >= 3
                else None
            )
            logger.warning(
                "Unauthorized request to %s: %s",
                f.__name__,
                err[1] if err else "authentication required",
            )
            if err:
                return security_error_response(err)
            return jsonify({"success": False, "error": "Authentication required"}), 401

        except Exception as e:
            logger.error("Authentication/authorization error in %s: %s", f.__name__, str(e))
            return SecureErrorHandler.handle_database_error(
                e, {"function": f.__name__, "endpoint": request.endpoint}
            )

    return decorated_function


def standardize_success_response(data=None, message="Success", status_code=200):
    """
    Create standardized success response format.
    Eliminates repeated success response patterns.
    """
    response = {"success": True, "message": message}

    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response["data"] = data

    return jsonify(response), status_code


def standardize_error_response(error_message, status_code=400, error_code=None):
    """
    Create standardized error response format.
    Eliminates repeated error response patterns.
    """
    response = {"success": False, "error": error_message}

    if error_code:
        response["error_code"] = error_code

    return jsonify(response), status_code


# Combined decorator for common route patterns
def api_route(require_auth=True, require_json=False, required_fields=None, require_agent=False):
    """
    Combined decorator that handles the most common route patterns.

    Args:
        require_auth: Whether to require user authentication
        require_json: Whether to require JSON request data
        required_fields: List of required JSON fields
        require_agent: Whether to require agent authorization
    """

    def decorator(f):
        # Apply decorators in reverse order (innermost first)
        decorated = f

        # Exception handling (outermost)
        decorated = handle_exceptions_with_logging(decorated)

        # Agent access check
        if require_agent:
            decorated = require_agent_access(decorated)

        # JSON validation
        if require_json:
            decorated = validate_json_request(required_fields)(decorated)

        # Authentication (innermost for routes that need it)
        if require_auth:
            decorated = require_authenticated_user(decorated)

        return decorated

    return decorator


# OpenAPI Validation Integration (Phase 1: Migration Support)
def require_validated_user(request_schema=None):
    """
    Combines user authentication with optional OpenAPI request validation.

    This decorator provides a migration path to OpenAPI validation while
    maintaining compatibility with existing authentication patterns.

    Args:
        request_schema: Optional Pydantic model class from app.schemas.generated
                       If provided, validates request body against schema

    Usage:
        from app.schemas import LoginData

        @auth_bp.route('/login', methods=['POST'])
        @require_validated_user(LoginData)
        def login(user, data: LoginData):
            # user: authenticated User model
            # data: validated Pydantic model (or None in gradual mode)
            return handle_login(data.model_dump())

        # Without validation (existing pattern):
        @user_bp.route('/profile', methods=['GET'])
        @require_validated_user()
        def get_profile(user):
            return jsonify({"success": True, "user": user.to_dict()})
    """
    from app.utils.validation import validate_request

    def decorator(f):
        # Start with authentication
        decorated = require_authenticated_user(f)

        # Add request validation if schema provided
        if request_schema:
            decorated = validate_request(request_schema)(decorated)

        return decorated

    return decorator


def require_validated_agent(request_schema=None):
    """
    Combines agent authorization with optional OpenAPI request validation.

    Args:
        request_schema: Optional Pydantic model class from app.schemas.generated

    Usage:
        from app.schemas import CreateTodoRequest

        @agent_bp.route('/todos', methods=['POST'])
        @require_validated_agent(CreateTodoRequest)
        def create_todo(user, data: CreateTodoRequest):
            # user: authenticated agent User model
            # data: validated Pydantic model (or None in gradual mode)
            return create_agent_todo(user.id, data.model_dump())
    """
    from app.utils.validation import validate_request

    def decorator(f):
        # Start with agent authorization
        decorated = require_agent_access(f)

        # Add request validation if schema provided
        if request_schema:
            decorated = validate_request(request_schema)(decorated)

        return decorated

    return decorator
