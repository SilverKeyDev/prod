"""Signup, verify, and resend-code handlers."""

from flask import current_app, jsonify, request

from app.services.auth.flows import handle_resend_code, handle_signup, handle_verification
from app.services.auth.utils import (
    create_error_response,
    generate_request_id,
    mask_email,
    validate_required_fields,
)


def signup():
    """Register a new user"""
    data = request.get_json()
    is_valid, error_msg = validate_required_fields(data, ["email", "password", "name"])
    if not is_valid:
        error_response, status_code = create_error_response(
            "MISSING_FIELDS", error_msg or "Missing required fields"
        )
        return jsonify(error_response), status_code
    response_data, status_code = handle_signup(data)
    return jsonify(response_data), status_code


def verify():
    """Verify user's email with code and automatically log them in"""
    request_id = generate_request_id("verify")
    data = request.get_json()
    current_app.logger.info(
        "AUTH_VERIFY_START",
        extra={
            "request_id": request_id,
            "email": mask_email(data.get("email")) if data and data.get("email") else "missing",
        },
    )
    is_valid, error_msg = validate_required_fields(data, ["email", "code", "password"])
    if not is_valid:
        current_app.logger.warning(
            "AUTH_VERIFY_MISSING_FIELDS",
            extra={
                "request_id": request_id,
                "has_email": "email" in data if data else False,
                "has_code": "code" in data if data else False,
                "has_password": "password" in data if data else False,
            },
        )
        error_response, status_code = create_error_response(
            "MISSING_FIELDS", "Email, verification code, and password are required"
        )
        return jsonify(error_response), status_code
    resp, status_code = handle_verification(data, request_id)
    return resp


def resend_code():
    """Resend verification code to user's email"""
    data = request.get_json()
    is_valid, error_msg = validate_required_fields(data, ["email"])
    if not is_valid:
        error_response, status_code = create_error_response(
            "MISSING_EMAIL", "Email is required to resend verification code"
        )
        return jsonify(error_response), status_code
    response_data, status_code = handle_resend_code(data)
    return jsonify(response_data), status_code
