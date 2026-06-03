"""
Password reset flow helper - ensures Cognito account exists for users.
"""

import secrets
import string
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app import db
from app.models import User
from logger import log

from ..core.cognito_service import AWS_COGNITO_service
from ..utils.helpers import generate_request_id, mask_email


def handle_forgot_password(data: dict[str, Any], request_id: str) -> tuple[dict[str, Any], int]:
    """
    Thin service entry for forgot-password (used by unit tests and callers that want dict
    responses). Delegates to Cognito; returns generic success on UserNotFound (enumeration-safe).
    """
    email = data.get("email", "")
    result = AWS_COGNITO_service.forgot_password(email, request_id=request_id)
    if result.get("success"):
        return ({"success": True, "message": "Password reset code sent to your email"}, 200)
    err = str(result.get("error", "") or "")
    if err == "UserNotFoundException":
        return (
            {
                "success": True,
                "message": "If an account exists, a password reset code has been sent.",
            },
            200,
        )
    return (
        {"success": False, "message": result.get("message", "Failed to initiate password reset")},
        400,
    )


def handle_confirm_forgot_password(
    data: dict[str, Any], request_id: str
) -> tuple[dict[str, Any], int]:
    """
    Thin service entry for confirm-forgot-password. Maps ``confirmation_code`` (legacy) or
    ``code`` to Cognito.
    """
    _ = request_id
    email = data.get("email", "")
    code = data.get("confirmation_code") or data.get("code", "")
    new_password = data.get("new_password", "")
    result = AWS_COGNITO_service.confirm_forgot_password(
        username=email, confirmation_code=code, new_password=new_password
    )
    if result.get("success"):
        return ({"success": True, "message": "Password has been reset successfully"}, 200)
    err = str(result.get("error", "") or "")
    msg = str(result.get("message", "") or "").lower()
    if err == "ExpiredCodeException" or "expired" in msg:
        return ({"success": False, "message": "Verification code has expired"}, 400)
    if err == "CodeMismatchException" or ("invalid" in msg and "expired" not in msg):
        return ({"success": False, "message": "Invalid verification code"}, 400)
    if err == "InvalidPasswordException" or "password" in msg:
        return ({"success": False, "message": "Password does not meet requirements"}, 400)
    return ({"success": False, "message": result.get("message", "Failed to reset password")}, 400)


def ensure_cognito_account_for_user(email: str) -> tuple[str | None, str | None, bool]:
    """
    Ensure user has a Cognito account. Creates one if missing (for Google OAuth users).

    This function:
    - Looks up user by email in database
    - Checks if user has cognito_id
    - If user has google_id but no cognito_id:
      - Creates Cognito account via admin_create_user
      - Links cognito_id to user in database
      - Returns cognito_id and True (indicating account was just created)
    - If user already has cognito_id, returns it and False (account already existed)
    - Handles edge cases (user not found, Cognito account already exists, etc.)

    Args:
        email: User's email address

    Returns:
        Tuple of (cognito_id or None, error_message or None, was_just_created: bool)
    """
    request_id = generate_request_id("ensure_cognito")
    try:
        user = db.session.scalar(select(User).where(User.email == email))
        if not user:
            masked_email = mask_email(email)
            log.warn(
                "AUTH",
                "ENSURE_COGNITO_USER_NOT_FOUND",
                {"request_id": request_id, "email": masked_email},
            )
            return (None, "User not found", False)
        if user.cognito_id:
            masked_email = mask_email(email)
            log.debug(
                "AUTH",
                "ENSURE_COGNITO_ALREADY_EXISTS",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "cognito_id": user.cognito_id[:8] + "..." if user.cognito_id else None,
                },
            )
            return (user.cognito_id, None, False)
        if not user.google_id:
            masked_email = mask_email(email)
            log.warn(
                "AUTH",
                "ENSURE_COGNITO_NOT_GOOGLE_USER",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "note": "User exists but has neither cognito_id nor google_id",
                },
            )
            return (
                None,
                "User account exists but is not a Google OAuth user. Please contact support.",
                False,
            )
        user_attributes = [
            {"Name": "email", "Value": user.email},
            {"Name": "email_verified", "Value": "true"},
        ]
        if user.name:
            user_attributes.append({"Name": "name", "Value": user.name})
        if user.phone:
            user_attributes.append({"Name": "phone_number", "Value": user.phone})
        masked_email = mask_email(email)
        log.info(
            "AUTH",
            "ENSURE_COGNITO_CREATING_ACCOUNT",
            {"request_id": request_id, "email": masked_email, "user_id": user.id},
        )
        result = AWS_COGNITO_service.admin_create_user(
            username=user.email, user_attributes=user_attributes
        )
        if not result["success"]:
            error_msg = result.get("message", "Failed to create Cognito account")
            log.error(
                "ERRORS",
                "ENSURE_COGNITO_CREATION_FAILED",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "error": result.get("error"),
                    "error_message": error_msg,
                },
            )
            return (None, f"Failed to create Cognito account: {error_msg}", False)
        cognito_id = result["user_sub"]
        try:
            user.cognito_id = cognito_id
            user.updated_at = datetime.now(timezone.utc)
            db.session.commit()
            log.info(
                "AUTH",
                "ENSURE_COGNITO_ACCOUNT_CREATED",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "user_id": user.id,
                    "cognito_id": cognito_id[:8] + "..." if cognito_id else None,
                },
            )
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            permanent_password = "".join(secrets.choice(alphabet) for _ in range(16))
            if not any(c.isupper() for c in permanent_password):
                permanent_password = permanent_password[0].upper() + permanent_password[1:]
            if not any(c.islower() for c in permanent_password):
                permanent_password = permanent_password[0].lower() + permanent_password[1:]
            if not any(c.isdigit() for c in permanent_password):
                permanent_password = permanent_password[:-1] + secrets.choice(string.digits)
            if not any(c in "!@#$%^&*" for c in permanent_password):
                permanent_password = permanent_password[:-1] + secrets.choice("!@#$%^&*")
            set_password_result = AWS_COGNITO_service.admin_set_user_password(
                username=user.email, password=permanent_password, permanent=True
            )
            if not set_password_result["success"]:
                log.error(
                    "ERRORS",
                    "ENSURE_COGNITO_SET_PASSWORD_FAILED",
                    {
                        "request_id": request_id,
                        "email": masked_email,
                        "error": set_password_result.get("error"),
                        "error_message": set_password_result.get("message"),
                        "note": "Account created but failed to set permanent password - user may be in FORCE_CHANGE_PASSWORD status",
                    },
                )
                return (cognito_id, None, True)
            try:
                status_after_set = AWS_COGNITO_service.admin_get_user_status(user.email)
                if status_after_set["success"]:
                    log.info(
                        "AUTH",
                        "ENSURE_COGNITO_STATUS_AFTER_SET_PASSWORD",
                        {
                            "request_id": request_id,
                            "email": masked_email,
                            "user_status": status_after_set.get("user_status"),
                            "email_verified": status_after_set.get("email_verified"),
                            "is_confirmed": status_after_set.get("user_status") == "CONFIRMED",
                        },
                    )
                    if status_after_set.get("user_status") != "CONFIRMED":
                        log.warn(
                            "AUTH",
                            "ENSURE_COGNITO_STATUS_NOT_CONFIRMED",
                            {
                                "request_id": request_id,
                                "email": masked_email,
                                "user_status": status_after_set.get("user_status"),
                                "expected": "CONFIRMED",
                                "note": "User status is not CONFIRMED after setting permanent password",
                            },
                        )
            except Exception as status_check_error:
                log.debug(
                    "AUTH",
                    "ENSURE_COGNITO_STATUS_CHECK_FAILED",
                    {
                        "request_id": request_id,
                        "email": masked_email,
                        "error_type": type(status_check_error).__name__,
                        "error_message": str(status_check_error),
                        "note": "Status check after set password failed (non-blocking)",
                    },
                )
            log.info(
                "AUTH",
                "ENSURE_COGNITO_CONVERTED_TO_CONFIRMED",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "note": "Account created and immediately converted to CONFIRMED status",
                },
            )
            return (cognito_id, None, True)
        except Exception as db_error:
            db.session.rollback()
            log.error(
                "ERRORS",
                "ENSURE_COGNITO_DB_UPDATE_FAILED",
                {
                    "request_id": request_id,
                    "email": masked_email,
                    "error": str(db_error),
                    "cognito_id": cognito_id[:8] + "..." if cognito_id else None,
                },
            )
            return (None, f"Failed to link Cognito account to user: {str(db_error)}", False)
    except Exception as e:
        masked_email = mask_email(email) if email else "unknown"
        log.error(
            "ERRORS",
            "ENSURE_COGNITO_UNEXPECTED_ERROR",
            {
                "request_id": request_id,
                "email": masked_email,
                "error": str(e),
                "error_type": type(e).__name__,
            },
        )
        return (None, f"An unexpected error occurred: {str(e)}", False)
