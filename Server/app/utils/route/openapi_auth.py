"""OpenAPI validation-aware auth decorators."""

from app.utils.route.auth_decorators import require_agent_access, require_authenticated_user


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
            # data: validated Pydantic model (or unvalidated model_construct in gradual mode)
            return handle_login(data.model_dump())

        # Without validation (existing pattern):
        @user_bp.route('/profile', methods=['GET'])
        @require_validated_user()
        def get_profile(user):
            return jsonify({"success": True, "user": UserDTO.to_response(user)})
    """
    from app.utils.validation import validate_request

    def decorator(f):
        decorated = require_authenticated_user(f)

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
            # data: validated Pydantic model (or unvalidated model_construct in gradual mode)
            return create_agent_todo(user.id, data.model_dump())
    """
    from app.utils.validation import validate_request

    def decorator(f):
        decorated = require_agent_access(f)

        if request_schema:
            decorated = validate_request(request_schema)(decorated)

        return decorated

    return decorator
