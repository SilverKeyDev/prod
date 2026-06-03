"""Login handler with OpenAPI validation."""

import traceback

from flask import current_app, jsonify

from app.schemas import AuthResponse, LoginData
from app.services.auth.flows import handle_login
from app.services.auth.utils import create_error_response, generate_request_id
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=10, window_seconds=60)
@validate_request(LoginData)
@validate_response(AuthResponse)
def login(data: LoginData | None = None):
    """
    Authenticate user and return Cognito JWT tokens directly.

    Request body validated against OpenAPI LoginData schema.
    """
    request_id = generate_request_id("login")
    try:
        if data is None:
            error_response, status_code = create_error_response(
                "INVALID_REQUEST", "Invalid login payload"
            )
            return jsonify(error_response), status_code

        request_data = {
            "email": data.email,
            "password": data.password.get_secret_value(),
        }

        resp, status_code = handle_login(request_data, request_id)
        return resp, status_code
    except Exception as e:
        current_app.logger.error(
            "AUTH_LOGIN_EXCEPTION",
            extra={
                "request_id": request_id,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc()[:500],
            },
        )
        error_response, status_code = create_error_response(
            "LOGIN_FAILED", "Failed to authenticate user"
        )
        return jsonify(error_response), 500
