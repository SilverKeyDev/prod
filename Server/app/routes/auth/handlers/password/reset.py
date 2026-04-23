"""Reset-password route handler."""

import time
import traceback
from typing import cast

from flask import Response, current_app, jsonify, request

from app.schemas import AuthResponse, ResetPasswordData
from app.services.auth.core import AWS_COGNITO_service
from app.services.auth.utils import (
    create_error_response,
    generate_request_id,
    mask_email,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=10, window_seconds=60)
@validate_request(ResetPasswordData)
@validate_response(AuthResponse)
def reset_password(data: ResetPasswordData | None = None):
    """Confirm forgot password with code, set new password, and auto-login"""
    request_id = generate_request_id("reset_password")
    start_time = time.time()
    if data is None:
        request_data = request.get_json()
        if not request_data or not all(
            k in request_data for k in ["email", "code", "new_password"]
        ):
            error_response, status_code = create_error_response(
                "MISSING_FIELDS", "Email, code, and new password are required"
            )
            return jsonify(error_response), status_code
    else:
        # Extract SecretStr new_password value for Cognito
        email = data.email
        code = data.code
        new_password = data.new_password.get_secret_value()
        request_data = {
            "email": email,
            "code": code,
            "new_password": new_password,
        }
    email = request_data["email"]
    masked_email = mask_email(email)
    current_app.logger.info(
        "RESET_PASSWORD_START", extra={"request_id": request_id, "email": masked_email}
    )
    result = AWS_COGNITO_service.confirm_forgot_password(
        username=email,
        confirmation_code=request_data["code"],
        new_password=request_data["new_password"],
    )
    if not result["success"]:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(
            "RESET_PASSWORD_CONFIRM_FAILED",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "error": result.get("error"),
                "message": result.get("message"),
                "duration_ms": duration_ms,
            },
        )
        err = result.get("error", "RESET_PASSWORD_FAILED")
        msg = result.get("message", "Failed to reset password")
        error_response, status_code = create_error_response(
            str(err) if err is not None else "RESET_PASSWORD_FAILED",
            str(msg) if msg is not None else "Failed to reset password",
        )
        return jsonify(error_response), status_code
    try:
        from app.services.auth.user.lookup import find_or_create_user_by_cognito
        from app.services.auth.utils.cookies import set_auth_cookies
        from app.services.auth.utils.responses import create_auth_response
        from app.services.auth.utils.token_creation import (
            create_minimal_tokens,
            decode_cognito_token,
        )

        login_result = AWS_COGNITO_service.sign_in(
            username=email, password=request_data["new_password"]
        )
        if not login_result["success"]:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.warning(
                "RESET_PASSWORD_LOGIN_FAILED",
                extra={"request_id": request_id, "email": masked_email, "duration_ms": duration_ms},
            )
            return jsonify(
                {
                    "success": True,
                    "message": "Password reset successfully. Please log in manually.",
                    "login_failed": True,
                }
            ), 200
        id_token = login_result["tokens"]["IdToken"]
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token["sub"]
        user = find_or_create_user_by_cognito(user_sub, email)
        user_id = str(user.id) if user else user_sub
        user_name = user.name if user else "Unknown User"
        minimal_access_token, minimal_id_token = create_minimal_tokens(
            user_id=user_id,
            user_email=email,
            user_name=user_name,
            expires_in_hours=8,
            fallback_access_token=login_result["tokens"]["AccessToken"],
            fallback_id_token=login_result["tokens"]["IdToken"],
        )
        resp = create_auth_response(
            user=user,
            user_sub=user_sub,
            email=email,
            access_token=minimal_access_token,
            id_token=minimal_id_token,
            message="Password reset and logged in successfully",
        )
        resp = set_auth_cookies(
            cast(Response, resp),
            access_token=minimal_access_token,
            refresh_token=login_result["tokens"]["RefreshToken"],
            request_id=request_id,
        )
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.info(
            "RESET_PASSWORD_SUCCESS",
            extra={"request_id": request_id, "email": masked_email, "duration_ms": duration_ms},
        )
        return resp, 200
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(
            "RESET_PASSWORD_EXCEPTION",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "error": str(e),
                "error_type": type(e).__name__,
                "duration_ms": duration_ms,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return jsonify(
            {
                "success": True,
                "message": "Password reset successfully. Please log in manually.",
                "auto_login_failed": True,
            }
        ), 200
