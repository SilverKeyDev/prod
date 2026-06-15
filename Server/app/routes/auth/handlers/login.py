"""Login handler with OpenAPI validation."""

from app.schemas import AuthResponse, LoginData
from app.services.auth.flows import handle_login
from app.services.auth.utils import generate_request_id
from app.utils.common_patterns import handle_exceptions_with_logging
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=10, window_seconds=60)
@handle_exceptions_with_logging
@validate_request(LoginData)
@validate_response(AuthResponse)
def login(data: LoginData):
    """
    Authenticate user and return Cognito JWT tokens directly.

    Request body validated against OpenAPI LoginData schema.
    """
    request_id = generate_request_id("login")
    request_data = {
        "email": data.email,
        "password": data.password.get_secret_value(),
    }
    resp, status_code = handle_login(request_data, request_id)
    return resp, status_code
