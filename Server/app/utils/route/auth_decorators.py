"""Authentication and authorization decorators for Flask routes."""

from functools import wraps

from flask import jsonify, request

from app.services.agent.client_service import agent_may_access_client
from app.services.auth import SecurityException
from app.utils.route.auth_errors import (
    security_exception_response,
    unexpected_auth_error_response,
)
from app.utils.security.app_logging import get_logger

logger = get_logger()


def require_authenticated_user(f):
    """
    Decorator that handles user authentication and returns standardized error responses.
    Eliminates the repeated pattern of get_current_user() + error handling.
    Auth failures (SecurityException) return 401 without logging tracebacks.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.services.auth import get_current_user

        try:
            user = get_current_user()
            if not user:
                logger.warning("Unauthorized request to %s: user not found in token", f.__name__)
                return jsonify({"error": "Unauthorized", "success": False}), 401

            return f(user, *args, **kwargs)

        except SecurityException as e:
            return security_exception_response(e, route_name=f.__name__)

        except Exception as e:
            return unexpected_auth_error_response(e, route_name=f.__name__)

    return decorated_function


def require_agent_access(f):
    """
    Decorator that ensures the user is an agent and has access to the specified client.
    Eliminates repeated agent authorization patterns.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.services.auth import get_current_user

        try:
            user = get_current_user()
            if not user:
                logger.warning(f"🚫 Unauthorized request to {f.__name__}: user not found in token")
                return jsonify({"error": "Unauthorized", "success": False}), 401

            if not user.is_agent:
                logger.warning(
                    f"🚫 Non-agent user {user.id} attempted to access agent endpoint {f.__name__}"
                )
                return jsonify(
                    {"error": "Only agents can access this endpoint", "success": False}
                ), 403

            data = request.get_json(silent=True) or {}
            target_user_id = (
                data.get("user_id")
                or data.get("target_user_id")
                or request.args.get("user_id")
                or request.args.get("target_user_id")
            )

            if target_user_id:
                target_s = str(target_user_id).strip()
                if not agent_may_access_client(str(user.id), target_s):
                    logger.warning(
                        f"🚫 Agent {user.id} attempted to access client {target_s} not in their list"
                    )
                    return jsonify(
                        {"error": "Access denied: User is not your client", "success": False}
                    ), 403

            return f(user, *args, **kwargs)

        except SecurityException as e:
            return security_exception_response(e, route_name=f.__name__)

        except Exception as e:
            return unexpected_auth_error_response(
                e,
                route_name=f.__name__,
                log_prefix="Authentication/authorization error",
            )

    return decorated_function


def require_brokerage_scope(f):
    """
    Decorator for brokerage-admin-only routes.

    When ``user.brokerage_org_ids`` is populated, requires ``brokerage_org_id`` on the request
    (query or JSON body) to match one of the allowed ids. Until membership is stored on the user
    row, this returns 403 so endpoints can be wired without silently widening access.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.services.auth import get_current_user

        try:
            user = get_current_user()
            if not user:
                logger.warning("Unauthorized request to %s: user not found in token", f.__name__)
                return jsonify({"error": "Unauthorized", "success": False}), 401

            allowed = getattr(user, "brokerage_org_ids", None) or []
            if not allowed:
                logger.warning(
                    "Brokerage scope denied for %s: user %s has no brokerage_org_ids",
                    f.__name__,
                    getattr(user, "id", "unknown"),
                )
                return jsonify(
                    {
                        "error": "Brokerage access is not configured for this account",
                        "success": False,
                    }
                ), 403

            data = request.get_json(silent=True) or {}
            org_id = data.get("brokerage_org_id") or request.args.get("brokerage_org_id")
            if not org_id:
                return jsonify(
                    {"error": "brokerage_org_id is required for this endpoint", "success": False}
                ), 400

            allowed_set = {str(x) for x in allowed}
            if str(org_id) not in allowed_set:
                logger.warning(
                    "Brokerage scope denied for %s: org %s not in allowed list for user %s",
                    f.__name__,
                    org_id,
                    getattr(user, "id", "unknown"),
                )
                return jsonify(
                    {"error": "Forbidden for this brokerage organization", "success": False}
                ), 403

            return f(user, *args, **kwargs)

        except SecurityException as e:
            return security_exception_response(e, route_name=f.__name__)

        except Exception as e:
            return unexpected_auth_error_response(
                e,
                route_name=f.__name__,
                log_prefix="Brokerage scope error",
            )

    return decorated_function
