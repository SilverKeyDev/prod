"""Forgot-password route handler."""

import secrets
import string

from flask import jsonify

from app.schemas import ForgotPasswordData, SuccessResponse
from app.services.auth.core import AWS_COGNITO_service
from app.services.auth.flows import ensure_cognito_account_for_user
from app.services.auth.utils import (
    generate_request_id,
    mask_email,
)
from app.utils.common_patterns import handle_exceptions_with_logging
from app.utils.route import http_errors
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


def _enumeration_safe_forgot_response():
    return jsonify(
        {
            "success": True,
            "message": "If an account exists, a password reset code has been sent.",
        }
    ), 200


def _map_ensure_cognito_error(error: str, request_id: str):
    if "not found" in error.lower():
        return _enumeration_safe_forgot_response()
    if "google oauth" in error.lower() or "contact support" in error.lower():
        return http_errors.validation("Unable to process password reset for this account.")
    return http_errors.server_error(
        Exception("ensure_cognito_account_failed"),
        context={"request_id": request_id},
    )


def _map_forgot_password_failure(
    result: dict, request_id: str, masked_email: str, was_just_created: bool
):
    error_code = str(result.get("error", "") or "")
    error_message = result.get("message", "Unknown error")
    log.error(
        "AUTH",
        "forgot_password_failed",
        {
            "request_id": request_id,
            "email": masked_email,
            "error": error_code,
            "error_message": error_message,
            "was_just_created": was_just_created,
        },
    )
    if error_code == "UserNotFoundException":
        return _enumeration_safe_forgot_response()
    if error_code == "TooManyRequestsException":
        return http_errors.rate_limited()
    if error_code == "InvalidParameterException":
        return http_errors.validation("Invalid request")
    return http_errors.external_unavailable(
        Exception("forgot_password_failed"),
        api_name="cognito",
        context={"request_id": request_id, "error_code": error_code},
    )


@rate_limit(max_requests=5, window_seconds=60)
@handle_exceptions_with_logging
@validate_request(ForgotPasswordData)
@validate_response(SuccessResponse)
def forgot_password(data: ForgotPasswordData):
    """Initiate forgot password flow"""
    request_id = generate_request_id("forgot_password")
    request_data = data.model_dump()
    email = request_data["email"]
    masked_email = mask_email(email)
    log.info("AUTH", "forgot_password_start", {"request_id": request_id, "email": masked_email})
    cognito_id, error, was_just_created = ensure_cognito_account_for_user(email)
    if error:
        log.warn(
            "AUTH",
            "forgot_password_cognito_account_error",
            {"request_id": request_id, "email": masked_email, "error": error},
        )
        return _map_ensure_cognito_error(error, request_id)
    log.info(
        "AUTH",
        "forgot_password_cognito_account_ensured",
        {
            "request_id": request_id,
            "email": masked_email,
            "cognito_id": cognito_id[:8] + "..." if cognito_id else None,
            "was_just_created": was_just_created,
        },
    )
    user_status_result = {"success": False, "user_status": "UNKNOWN", "email_verified": None}
    try:
        user_status_result = AWS_COGNITO_service.admin_get_user_status(email)
        if user_status_result["success"]:
            log.info(
                "AUTH",
                "forgot_password_user_status_check",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "user_status": user_status_result.get("user_status"),
                    "email_verified": user_status_result.get("email_verified"),
                    "has_email": bool(user_status_result.get("email")),
                },
            )
            if not user_status_result.get("email_verified", False):
                log.warn(
                    "AUTH",
                    "forgot_password_email_not_verified",
                    {
                        "request_id": request_id,
                        "email": masked_email,
                        "user_status": user_status_result.get("user_status"),
                    },
                )
        else:
            log.warn(
                "AUTH",
                "forgot_password_status_check_failed",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "error": user_status_result.get("error"),
                    "error_message": user_status_result.get("message"),
                },
            )
    except Exception as status_check_error:
        log.warn(
            "AUTH",
            "forgot_password_status_check_exception",
            {
                "request_id": request_id,
                "email": masked_email,
                "error_type": type(status_check_error).__name__,
                "error_message": str(status_check_error),
            },
        )
    if (
        user_status_result.get("success")
        and user_status_result.get("user_status") == "FORCE_CHANGE_PASSWORD"
    ):
        if was_just_created:
            log.warn(
                "AUTH",
                "forgot_password_new_account_force_change",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "user_status": user_status_result.get("user_status"),
                    "email_verified": user_status_result.get("email_verified"),
                },
            )
        else:
            log.warn(
                "AUTH",
                "forgot_password_existing_force_change",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "user_status": user_status_result.get("user_status"),
                    "email_verified": user_status_result.get("email_verified"),
                },
            )
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            temp_password = "".join(secrets.choice(alphabet) for _ in range(16))
            if not any(c.isupper() for c in temp_password):
                temp_password = temp_password[0].upper() + temp_password[1:]
            if not any(c.islower() for c in temp_password):
                temp_password = temp_password[0].lower() + temp_password[1:]
            if not any(c.isdigit() for c in temp_password):
                temp_password = temp_password[:-1] + secrets.choice(string.digits)
            if not any(c in "!@#$%^&*" for c in temp_password):
                temp_password = temp_password[:-1] + secrets.choice("!@#$%^&*")
            set_password_result = AWS_COGNITO_service.admin_set_user_password(
                username=email, password=temp_password, permanent=True
            )
            if not set_password_result["success"]:
                log.error(
                    "AUTH",
                    "forgot_password_set_password_failed",
                    {
                        "request_id": request_id,
                        "email": masked_email,
                        "error": set_password_result.get("error"),
                        "error_message": set_password_result.get("message"),
                    },
                )
            else:
                try:
                    status_after_set = AWS_COGNITO_service.admin_get_user_status(email)
                    if status_after_set["success"]:
                        log.info(
                            "AUTH",
                            "forgot_password_status_after_set_password",
                            {
                                "request_id": request_id,
                                "email": masked_email,
                                "previous_status": user_status_result.get("user_status"),
                                "new_status": status_after_set.get("user_status"),
                                "email_verified": status_after_set.get("email_verified"),
                            },
                        )
                        user_status_result = status_after_set
                except Exception as status_check_err:
                    log.debug(
                        "AUTH",
                        "forgot_password_status_after_set_check_failed",
                        {
                            "request_id": request_id,
                            "email": masked_email,
                            "error_type": type(status_check_err).__name__,
                            "error_message": str(status_check_err),
                        },
                    )
    if was_just_created:
        log.info(
            "AUTH",
            "forgot_password_new_account",
            {
                "request_id": request_id,
                "email": masked_email,
                "user_status": user_status_result.get("user_status")
                if user_status_result.get("success")
                else "UNKNOWN",
            },
        )
    result = AWS_COGNITO_service.forgot_password(
        email,
        request_id=request_id,
        user_status=user_status_result.get("user_status")
        if user_status_result.get("success")
        else None,
    )
    if not result["success"]:
        return _map_forgot_password_failure(result, request_id, masked_email, was_just_created)
    code_delivery = result.get("code_delivery", {})
    delivery_medium = result.get("delivery_medium", "UNKNOWN")
    destination = result.get("destination", "UNKNOWN")
    attribute_name = result.get("attribute_name", "UNKNOWN")
    aws_request_id = result.get("aws_request_id")
    aws_http_status = result.get("aws_http_status")
    masked_destination = (
        destination[:3] + "***" + destination[-3:]
        if destination and destination != "UNKNOWN" and len(destination) > 6
        else destination
    )
    log.info(
        "AUTH",
        "forgot_password_success",
        {
            "request_id": request_id,
            "email": masked_email,
            "was_just_created": was_just_created,
            "delivery_medium": delivery_medium,
            "destination": masked_destination,
            "attribute_name": attribute_name,
            "has_code_delivery": bool(code_delivery),
            "email_will_be_sent": delivery_medium == "EMAIL" and destination != "UNKNOWN",
            "aws_request_id": aws_request_id,
            "aws_http_status": aws_http_status,
        },
    )
    if delivery_medium != "EMAIL":
        log.warn(
            "AUTH",
            "forgot_password_unexpected_delivery_medium",
            {
                "request_id": request_id,
                "email": masked_email,
                "delivery_medium": delivery_medium,
                "expected": "EMAIL",
            },
        )
    if destination == "UNKNOWN" or not destination:
        log.warn(
            "AUTH",
            "forgot_password_no_destination",
            {
                "request_id": request_id,
                "email": masked_email,
                "has_code_delivery": bool(code_delivery),
            },
        )
    return jsonify(
        {
            "success": True,
            "message": "Password reset code sent to your email",
            "code_delivery": code_delivery,
        }
    )
