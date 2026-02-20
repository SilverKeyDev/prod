"""Login handler."""

import traceback

from flask import current_app, jsonify, request

from app.services.auth.flows import handle_login
from app.services.auth.utils import (
    create_error_response,
    generate_request_id,
    validate_required_fields,
)


def login():
    """Authenticate user and return Cognito JWT tokens directly"""
    request_id = generate_request_id("login")
    try:
        data = request.get_json()
        is_valid, error_msg = validate_required_fields(data, ["email", "password"])
        if not is_valid:
            current_app.logger.error(
                "AUTH_LOGIN_MISSING_FIELDS",
                extra={
                    "request_id": request_id,
                    "missing_fields": [f for f in ["email", "password"] if f not in (data or {})],
                    "provided_fields": list(data.keys()) if data else [],
                },
            )
            error_response, status_code = create_error_response(
                "MISSING_FIELDS", "Email and password are required"
            )
            return jsonify(error_response), status_code
        resp, status_code = handle_login(data, request_id)
        return resp
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
