"""Signup, verify, and resend-code handlers."""

from flask import Response, jsonify

from app.schemas import AuthResponse, ResendCodeData, SignupData, SuccessResponse, VerifyData
from app.services.auth.flows import handle_resend_code, handle_signup, handle_verification
from app.services.auth.utils import (
    generate_request_id,
    mask_email,
)
from app.utils.common_patterns import handle_exceptions_with_logging
from app.utils.route import http_errors
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


def _enumeration_safe_resend_response() -> tuple[Response, int]:
    return jsonify(
        {
            "success": True,
            "message": "If verification is still required, a code has been sent to your email.",
        }
    ), 200


@rate_limit(max_requests=10, window_seconds=60)
@handle_exceptions_with_logging
@validate_request(SignupData)
@validate_response(AuthResponse)
def signup(data: SignupData):
    """Register a new user"""
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
    if status_code >= 400:
        if response_data.get("error") == "UsernameExistsException":
            return http_errors.conflict(
                "An account with this email already exists. Please sign in instead.",
                error_code="ACCOUNT_ALREADY_EXISTS",
            )
        return http_errors.validation("Failed to register user")
    return jsonify(response_data), status_code


@rate_limit(max_requests=10, window_seconds=60)
@handle_exceptions_with_logging
@validate_request(VerifyData)
@validate_response(AuthResponse)
def verify(data: VerifyData):
    """Verify user's email with code and automatically log them in"""
    request_id = generate_request_id("verify")
    request_data = {
        "email": data.email,
        "code": data.code,
        "password": data.password.get_secret_value(),
    }
    log.info(
        "AUTH",
        "auth_verify_start",
        {
            "request_id": request_id,
            "email": mask_email(request_data.get("email")),
        },
    )
    resp, status_code = handle_verification(request_data, request_id)
    if status_code >= 400:
        return http_errors.validation("Failed to verify email address")
    return resp, status_code


@rate_limit(max_requests=5, window_seconds=60)
@handle_exceptions_with_logging
@validate_request(ResendCodeData)
@validate_response(SuccessResponse)
def resend_code(data: ResendCodeData):
    """Resend verification code to user's email"""
    request_data = data.model_dump()
    response_data, status_code = handle_resend_code(request_data)
    if status_code == 404:
        return _enumeration_safe_resend_response()
    if status_code >= 500:
        return http_errors.server_error(
            Exception("resend_code_failed"),
            context={"email": mask_email(request_data.get("email", ""))},
        )
    if status_code >= 400:
        return http_errors.validation("Failed to resend verification code")
    return jsonify(response_data), status_code
