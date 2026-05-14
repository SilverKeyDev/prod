"""
Email verification flow handlers.
"""

import os
import time
import traceback
from typing import Any, cast

from flask import Response, current_app, make_response

from ..core.cognito_service import AWS_COGNITO_service
from ..user.lookup import find_or_create_user_by_cognito
from ..utils.code_delivery import normalize_cognito_code_delivery
from ..utils.cookies import set_auth_cookies
from ..utils.helpers import mask_email
from ..utils.responses import create_auth_response
from ..utils.token_creation import create_minimal_tokens, decode_cognito_token


def handle_verify_email(data: dict[str, Any], request_id: str) -> tuple[dict[str, Any], int]:
    """
    Confirm sign-up / email verification using Cognito (dict response API for unit tests).
    Does not auto-login; use ``handle_verification`` when password is available for auto-login.
    """
    _ = request_id
    code = data.get("confirmation_code") or data.get("code", "")
    result = AWS_COGNITO_service.confirm_sign_up(username=data["email"], confirmation_code=code)
    if result.get("success"):
        return {"success": True, "message": "Email verified successfully"}, 200
    err = str(result.get("error", "") or "")
    msg = str(result.get("message", "") or "").lower()
    if err == "NotAuthorizedException" or "already" in msg or "confirmed" in msg:
        return {"success": True, "message": "Email was already verified"}, 200
    if err == "CodeMismatchException" or "invalid" in msg:
        return {"success": False, "message": "Invalid verification code"}, 400
    if err == "ExpiredCodeException" or "expired" in msg:
        return {"success": False, "message": "Verification code has expired"}, 400
    return {
        "success": False,
        "message": result.get("message", "Failed to verify user"),
    }, 400


def handle_verification(data: dict[str, Any], request_id: str) -> tuple[Response, int]:
    """
    Handle email verification and auto-login flow.
    Returns (response, status_code).
    """
    start_time = time.time()

    # Verify email with code
    result = AWS_COGNITO_service.confirm_sign_up(
        username=data["email"], confirmation_code=data["code"]
    )

    if not result["success"]:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.warning(
            "❌ AUTH_VERIFY_COGNITO_CONFIRM_FAILED",
            extra={
                "request_id": request_id,
                "error": result.get("error"),
                "result_message": result.get("message"),
                "duration_ms": duration_ms,
            },
        )
        return make_response(
            {
                "success": False,
                "error": result.get("error", "VERIFICATION_FAILED"),
                "message": result.get("message", "Failed to verify user"),
            }
        ), 400

    # Auto-login after verification
    try:
        login_result = AWS_COGNITO_service.sign_in(
            username=data["email"], password=data["password"]
        )

        if not login_result["success"]:
            duration_ms = int((time.time() - start_time) * 1000)
            current_app.logger.warning(
                "⚠️ AUTH_VERIFY_LOGIN_FAILED_AFTER_VERIFICATION",
                extra={
                    "request_id": request_id,
                    "email": mask_email(data["email"]),
                    "duration_ms": duration_ms,
                },
            )
            return make_response(
                {
                    "success": True,
                    "message": "Email verified successfully. Please log in manually.",
                    "verification_complete": True,
                    "login_failed": True,
                }
            ), 200

        # Extract user info and create tokens
        id_token = login_result["tokens"]["IdToken"]
        decoded_id_token = decode_cognito_token(id_token)
        user_sub = decoded_id_token["sub"]

        user = find_or_create_user_by_cognito(user_sub, data["email"])
        user_id = str(user.id) if user else user_sub
        user_name = user.name if user else "Unknown User"

        minimal_access_token, minimal_id_token = create_minimal_tokens(
            user_id=user_id,
            user_email=data["email"],
            user_name=user_name,
            expires_in_hours=8,
            fallback_access_token=login_result["tokens"]["AccessToken"],
            fallback_id_token=login_result["tokens"]["IdToken"],
        )

        resp = create_auth_response(
            user=user,
            user_sub=user_sub,
            email=data["email"],
            access_token=minimal_access_token,
            id_token=minimal_id_token,
            message="Email verified and logged in successfully",
        )

        resp = set_auth_cookies(
            cast(Response, resp),
            access_token=minimal_access_token,
            refresh_token=login_result["tokens"]["RefreshToken"],
            request_id=request_id,
        )

        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.info(
            "AUTH_VERIFY_SUCCESS",
            extra={
                "request_id": request_id,
                "email": mask_email(data["email"]),
                "duration_ms": duration_ms,
            },
        )

        return resp, 200

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        current_app.logger.error(
            "❌ AUTH_VERIFY_EXCEPTION",
            extra={
                "request_id": request_id,
                "error": str(e),
                "error_type": type(e).__name__,
                "duration_ms": duration_ms,
                "traceback": traceback.format_exc()[:500],
            },
        )
        return make_response(
            {
                "success": True,
                "message": "Email verified successfully. Please log in manually.",
                "verification_complete": True,
                "auto_login_failed": True,
            }
        ), 200


def handle_resend_code(
    data: dict[str, Any], request_id: str | None = None
) -> tuple[dict[str, Any], int]:
    """
    Handle resend verification code flow.
    Returns (response_dict, status_code).
    """
    _ = request_id
    try:
        response = AWS_COGNITO_service.client.resend_confirmation_code(
            ClientId=os.getenv("AWS_COGNITO_CLIENT_ID"),
            SecretHash=AWS_COGNITO_service._get_secret_hash(data["email"]),
            Username=data["email"],
        )

        return {
            "success": True,
            "message": "Verification code has been resent to your email",
            "code_delivery": normalize_cognito_code_delivery(
                response.get("CodeDeliveryDetails", {})
            ),
        }, 200

    except AWS_COGNITO_service.client.exceptions.UserNotFoundException:
        return {
            "success": False,
            "error": "USER_NOT_FOUND",
            "message": "No user found with this email",
        }, 404

    except AWS_COGNITO_service.client.exceptions.NotAuthorizedException:
        return {
            "success": True,
            "message": "If verification is still required, a code has been sent to your email.",
        }, 200

    except AWS_COGNITO_service.client.exceptions.InvalidParameterException as e:
        return {"success": False, "error": "INVALID_PARAMETER", "message": str(e)}, 400

    except Exception as e:
        current_app.logger.error(f"Error resending verification code: {str(e)}")
        return {
            "success": False,
            "error": "RESEND_CODE_FAILED",
            "message": "Failed to resend verification code. Please try again.",
        }, 500
