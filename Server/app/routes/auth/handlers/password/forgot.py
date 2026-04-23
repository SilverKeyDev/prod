"""Forgot-password route handler."""

import secrets
import string

from flask import current_app, jsonify, request

from app.schemas import ForgotPasswordData, SuccessResponse
from app.services.auth.core import AWS_COGNITO_service
from app.services.auth.flows import ensure_cognito_account_for_user
from app.services.auth.utils import (
    create_error_response,
    generate_request_id,
    mask_email,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=5, window_seconds=60)
@validate_request(ForgotPasswordData)
@validate_response(SuccessResponse)
def forgot_password(data: ForgotPasswordData | None = None):
    """Initiate forgot password flow"""
    request_id = generate_request_id("forgot_password")
    if data is None:
        request_data = request.get_json()
        if not request_data or "email" not in request_data:
            error_response, status_code = create_error_response(
                "MISSING_EMAIL", "Email is required"
            )
            return jsonify(error_response), status_code
    else:
        request_data = data.model_dump()
    email = request_data["email"]
    masked_email = mask_email(email)
    current_app.logger.info(
        "FORGOT_PASSWORD_START", extra={"request_id": request_id, "email": masked_email}
    )
    cognito_id, error, was_just_created = ensure_cognito_account_for_user(email)
    if error:
        current_app.logger.warning(
            "FORGOT_PASSWORD_COGNITO_ACCOUNT_ERROR",
            extra={"request_id": request_id, "email": masked_email, "error": error},
        )
        error_code = (
            "USER_NOT_FOUND" if "not found" in error.lower() else "COGNITO_ACCOUNT_CREATION_FAILED"
        )
        status_code = 404 if "not found" in error.lower() else 500
        error_response, status_code = create_error_response(error_code, error)
        return jsonify(error_response), status_code
    current_app.logger.info(
        f"FORGOT_PASSWORD_COGNITO_ACCOUNT_ENSURED: was_just_created={was_just_created}",
        extra={
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
            current_app.logger.info(
                "FORGOT_PASSWORD_USER_STATUS_CHECK: status={}, email_verified={}".format(
                    user_status_result.get("user_status"), user_status_result.get("email_verified")
                ),
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "user_status": user_status_result.get("user_status"),
                    "email_verified": user_status_result.get("email_verified"),
                    "has_email": bool(user_status_result.get("email")),
                },
            )
            if not user_status_result.get("email_verified", False):
                current_app.logger.warning(
                    "FORGOT_PASSWORD_EMAIL_NOT_VERIFIED",
                    extra={
                        "request_id": request_id,
                        "email": masked_email,
                        "user_status": user_status_result.get("user_status"),
                        "warning": "Email may not be verified in Cognito, which could prevent email delivery",
                    },
                )
        else:
            current_app.logger.warning(
                "FORGOT_PASSWORD_STATUS_CHECK_FAILED",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "error": user_status_result.get("error"),
                    "error_message": user_status_result.get("message"),
                    "note": "Could not verify user status, proceeding anyway",
                },
            )
    except Exception as status_check_error:
        current_app.logger.warning(
            "FORGOT_PASSWORD_STATUS_CHECK_EXCEPTION",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "error_type": type(status_check_error).__name__,
                "error_message": str(status_check_error),
                "note": "Status check failed but proceeding anyway (non-blocking)",
            },
        )
    if (
        user_status_result.get("success")
        and user_status_result.get("user_status") == "FORCE_CHANGE_PASSWORD"
    ):
        if was_just_created:
            current_app.logger.warning(
                "FORGOT_PASSWORD_NEW_ACCOUNT_STILL_FORCE_CHANGE",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "user_status": user_status_result.get("user_status"),
                    "email_verified": user_status_result.get("email_verified"),
                    "note": "Newly created account is still in FORCE_CHANGE_PASSWORD - this should have been converted to CONFIRMED",
                },
            )
        else:
            current_app.logger.warning(
                "FORGOT_PASSWORD_FORCE_CHANGE_STATUS_FOR_EXISTING_ACCOUNT",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "user_status": user_status_result.get("user_status"),
                    "email_verified": user_status_result.get("email_verified"),
                    "note": "Existing account is in FORCE_CHANGE_PASSWORD status; attempting to convert to CONFIRMED",
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
                current_app.logger.error(
                    "FORGOT_PASSWORD_SET_PASSWORD_FAILED",
                    extra={
                        "request_id": request_id,
                        "email": masked_email,
                        "error": set_password_result.get("error"),
                        "error_message": set_password_result.get("message"),
                        "note": "Failed to convert FORCE_CHANGE_PASSWORD to CONFIRMED - proceeding anyway but email may not send",
                    },
                )
            else:
                try:
                    status_after_set = AWS_COGNITO_service.admin_get_user_status(email)
                    if status_after_set["success"]:
                        current_app.logger.info(
                            "FORGOT_PASSWORD_STATUS_AFTER_SET_PASSWORD",
                            extra={
                                "request_id": request_id,
                                "email": masked_email,
                                "previous_status": user_status_result.get("user_status"),
                                "new_status": status_after_set.get("user_status"),
                                "email_verified": status_after_set.get("email_verified"),
                            },
                        )
                        user_status_result = status_after_set
                except Exception as status_check_err:
                    current_app.logger.debug(
                        "FORGOT_PASSWORD_STATUS_AFTER_SET_CHECK_FAILED",
                        extra={
                            "request_id": request_id,
                            "email": masked_email,
                            "error_type": type(status_check_err).__name__,
                            "error_message": str(status_check_err),
                            "note": "Status check after set password failed (non-blocking)",
                        },
                    )
    if was_just_created:
        current_app.logger.info(
            "FORGOT_PASSWORD_NEW_ACCOUNT",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "user_status": user_status_result.get("user_status")
                if user_status_result.get("success")
                else "UNKNOWN",
                "note": "Account was just created and should already be CONFIRMED",
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
        error_code = result.get("error", "UNKNOWN")
        error_message = result.get("message", "Unknown error")
        current_app.logger.error(
            f"FORGOT_PASSWORD_FAILED: {error_code} - {error_message} (was_just_created={was_just_created})",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "error": error_code,
                "error_message": error_message,
                "was_just_created": was_just_created,
            },
        )
        error_response, status_code = create_error_response(
            result.get("error", "FORGOT_PASSWORD_FAILED"),
            result.get("message", "Failed to initiate password reset"),
        )
        return jsonify(error_response), status_code
    code_delivery = result.get("code_delivery", {})
    delivery_medium = result.get("delivery_medium", "UNKNOWN")
    destination = result.get("destination", "UNKNOWN")
    attribute_name = result.get("attribute_name", "UNKNOWN")
    aws_request_id = result.get("aws_request_id")
    aws_http_status = result.get("aws_http_status")
    current_app.logger.info(
        "FORGOT_PASSWORD_SUCCESS",
        extra={
            "request_id": request_id,
            "email": masked_email,
            "was_just_created": was_just_created,
            "delivery_medium": delivery_medium,
            "destination": destination[:3] + "***" + destination[-3:]
            if destination and destination != "UNKNOWN" and len(destination) > 6
            else destination,
            "attribute_name": attribute_name,
            "has_code_delivery": bool(code_delivery),
            "email_will_be_sent": delivery_medium == "EMAIL" and destination != "UNKNOWN",
            "aws_request_id": aws_request_id,
            "aws_http_status": aws_http_status,
        },
    )
    if delivery_medium != "EMAIL":
        current_app.logger.warning(
            "FORGOT_PASSWORD_UNEXPECTED_DELIVERY_MEDIUM",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "delivery_medium": delivery_medium,
                "expected": "EMAIL",
                "warning": "Email may not be sent via expected method",
            },
        )
    if destination == "UNKNOWN" or not destination:
        current_app.logger.warning(
            "FORGOT_PASSWORD_NO_DESTINATION",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "code_delivery": code_delivery,
                "warning": "No destination email address found in code delivery details",
            },
        )
    return jsonify(
        {
            "success": True,
            "message": "Password reset code sent to your email",
            "code_delivery": code_delivery,
        }
    )
