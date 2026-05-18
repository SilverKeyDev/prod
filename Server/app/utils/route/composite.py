"""Combined route decorators for common patterns."""

from app.utils.route.auth_decorators import require_agent_access, require_authenticated_user
from app.utils.route.exception_decorators import handle_exceptions_with_logging
from app.utils.route.request_decorators import validate_json_request


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
        decorated = f

        decorated = handle_exceptions_with_logging(decorated)

        if require_agent:
            decorated = require_agent_access(decorated)

        if require_json:
            decorated = validate_json_request(required_fields)(decorated)

        if require_auth:
            decorated = require_authenticated_user(decorated)

        return decorated

    return decorator
