"""Signup, verify, and resend-code handlers."""

from flask import current_app, jsonify, request

from app.schemas import AuthResponse, ResendCodeData, SignupData, SuccessResponse, VerifyData
from app.services.auth.flows import handle_resend_code, handle_signup, handle_verification
from app.services.auth.utils import (
    create_error_response,
    generate_request_id,
    mask_email,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=10, window_seconds=60)
@validate_request(SignupData)
@validate_response(AuthResponse)
def signup(data: SignupData | None = None):
    """Register a new user"""
    if data is None:
        request_data = request.get_json(silent=True) or {}
        if not request_data or not all(k in request_data for k in ["email", "password", "name"]):
            error_response, status_code = create_error_response(
                "MISSING_FIELDS", "Email, password, and name are required"
            )
            return jsonify(error_response), status_code
    else:
        # Extract SecretStr password value for Cognito
        request_data = {
            "email": data.email,
            "password": data.password.get_secret_value(),
            "name": data.name,
        }
        if data.phone is not None and str(data.phone).strip():
            request_data["phone"] = str(data.phone).strip()
        if data.brokerage is not None and str(data.brokerage).strip():
            request_data["brokerage"] = str(data.brokerage).strip()
    response_data, status_code = handle_signup(request_data)
    return jsonify(response_data), status_code


@rate_limit(max_requests=10, window_seconds=60)
@validate_request(VerifyData)
@validate_response(AuthResponse)
def verify(data: VerifyData | None = None):
    """Verify user's email with code and automatically log them in"""
    request_id = generate_request_id("verify")

    if data is None:
        request_data = request.get_json(silent=True) or {}
        email = request_data.get("email") if request_data else None
        current_app.logger.info(
            "AUTH_VERIFY_START",
            extra={
                "request_id": request_id,
                "email": mask_email(email) if email else "missing",
            },
        )
        if not request_data or not all(k in request_data for k in ["email", "code", "password"]):
            current_app.logger.warning(
                "AUTH_VERIFY_MISSING_FIELDS",
                extra={
                    "request_id": request_id,
                    "has_email": "email" in request_data if request_data else False,
                    "has_code": "code" in request_data if request_data else False,
                    "has_password": "password" in request_data if request_data else False,
                },
            )
            error_response, status_code = create_error_response(
                "MISSING_FIELDS", "Email, verification code, and password are required"
            )
            return jsonify(error_response), status_code
    else:
        # Extract SecretStr password value for Cognito
        request_data = {
            "email": data.email,
            "code": data.code,
            "password": data.password.get_secret_value(),
        }
        current_app.logger.info(
            "AUTH_VERIFY_START",
            extra={
                "request_id": request_id,
                "email": mask_email(request_data.get("email")),
            },
        )
    resp, status_code = handle_verification(request_data, request_id)
    return resp, status_code


@rate_limit(max_requests=5, window_seconds=60)
@validate_request(ResendCodeData)
@validate_response(SuccessResponse)
def resend_code(data: ResendCodeData | None = None):
    """Resend verification code to user's email"""
    if data is None:
        request_data = request.get_json(silent=True) or {}
        if not request_data or "email" not in request_data:
            error_response, status_code = create_error_response(
                "MISSING_EMAIL", "Email is required to resend verification code"
            )
            return jsonify(error_response), status_code
    else:
        request_data = data.model_dump()
    response_data, status_code = handle_resend_code(request_data)
    return jsonify(response_data), status_code
