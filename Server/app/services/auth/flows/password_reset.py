"""
Password reset flow helper - ensures Cognito account exists for users.
"""

import secrets
import string
from datetime import datetime

from flask import current_app

from app import db
from app.models import User

from ..core.cognito_service import AWS_COGNITO_service
from ..utils.helpers import generate_request_id, mask_email


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
        # Look up user by email
        user = User.query.filter_by(email=email).first()

        if not user:
            masked_email = mask_email(email)
            current_app.logger.warning(
                "ENSURE_COGNITO_USER_NOT_FOUND",
                extra={"request_id": request_id, "email": masked_email},
            )
            return None, "User not found", False

        # If user already has cognito_id, return it
        if user.cognito_id:
            masked_email = mask_email(email)
            current_app.logger.debug(
                "ENSURE_COGNITO_ALREADY_EXISTS",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "cognito_id": user.cognito_id[:8] + "..." if user.cognito_id else None,
                },
            )
            return user.cognito_id, None, False

        # User has google_id but no cognito_id - need to create Cognito account
        if not user.google_id:
            masked_email = mask_email(email)
            current_app.logger.warning(
                "ENSURE_COGNITO_NOT_GOOGLE_USER",
                extra={
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

        # Prepare user attributes for Cognito
        user_attributes = [
            {"Name": "email", "Value": user.email},
            {"Name": "email_verified", "Value": "true"},  # Google OAuth users already verified
        ]

        if user.name:
            user_attributes.append({"Name": "name", "Value": user.name})

        if user.phone:
            user_attributes.append({"Name": "phone_number", "Value": user.phone})

        masked_email = mask_email(email)
        current_app.logger.info(
            "ENSURE_COGNITO_CREATING_ACCOUNT",
            extra={"request_id": request_id, "email": masked_email, "user_id": user.id},
        )

        # Create Cognito account
        result = AWS_COGNITO_service.admin_create_user(
            username=user.email, user_attributes=user_attributes
        )

        if not result["success"]:
            error_msg = result.get("message", "Failed to create Cognito account")
            current_app.logger.error(
                "ENSURE_COGNITO_CREATION_FAILED",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "error": result.get("error"),
                    "error_message": error_msg,
                },
            )
            return None, f"Failed to create Cognito account: {error_msg}", False

        # Link cognito_id to user in database
        cognito_id = result["user_sub"]
        try:
            user.cognito_id = cognito_id
            user.updated_at = datetime.utcnow()
            db.session.commit()

            current_app.logger.info(
                "ENSURE_COGNITO_ACCOUNT_CREATED",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "user_id": user.id,
                    "cognito_id": cognito_id[:8] + "..." if cognito_id else None,
                },
            )

            # Immediately convert user to CONFIRMED status by setting a permanent password
            # This ensures consistent behavior for password reset and login flows
            # Generate a secure password (user will reset it via forgot_password flow)
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            permanent_password = "".join(secrets.choice(alphabet) for _ in range(16))
            # Ensure it meets Cognito requirements
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
                current_app.logger.error(
                    "ENSURE_COGNITO_SET_PASSWORD_FAILED",
                    extra={
                        "request_id": request_id,
                        "email": masked_email,
                        "error": set_password_result.get("error"),
                        "error_message": set_password_result.get("message"),
                        "note": "Account created but failed to set permanent password - user may be in FORCE_CHANGE_PASSWORD status",
                    },
                )
                # Account was created but password setting failed - still return success
                # The account exists, but may need manual intervention
                return cognito_id, None, True

            # Verify status changed to CONFIRMED (non-blocking check)
            try:
                status_after_set = AWS_COGNITO_service.admin_get_user_status(user.email)
                if status_after_set["success"]:
                    current_app.logger.info(
                        "ENSURE_COGNITO_STATUS_AFTER_SET_PASSWORD",
                        extra={
                            "request_id": request_id,
                            "email": masked_email,
                            "user_status": status_after_set.get("user_status"),
                            "email_verified": status_after_set.get("email_verified"),
                            "is_confirmed": status_after_set.get("user_status") == "CONFIRMED",
                        },
                    )
                    if status_after_set.get("user_status") != "CONFIRMED":
                        current_app.logger.warning(
                            "ENSURE_COGNITO_STATUS_NOT_CONFIRMED",
                            extra={
                                "request_id": request_id,
                                "email": masked_email,
                                "user_status": status_after_set.get("user_status"),
                                "expected": "CONFIRMED",
                                "note": "User status is not CONFIRMED after setting permanent password",
                            },
                        )
            except Exception as status_check_error:
                # Non-blocking: if status check fails, log and continue
                current_app.logger.debug(
                    "ENSURE_COGNITO_STATUS_CHECK_FAILED",
                    extra={
                        "request_id": request_id,
                        "email": masked_email,
                        "error_type": type(status_check_error).__name__,
                        "error_message": str(status_check_error),
                        "note": "Status check after set password failed (non-blocking)",
                    },
                )

            current_app.logger.info(
                "ENSURE_COGNITO_CONVERTED_TO_CONFIRMED",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "note": "Account created and immediately converted to CONFIRMED status",
                },
            )

            # Return True to indicate account was just created
            return cognito_id, None, True

        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(
                "ENSURE_COGNITO_DB_UPDATE_FAILED",
                extra={
                    "request_id": request_id,
                    "email": masked_email,
                    "error": str(db_error),
                    "cognito_id": cognito_id[:8] + "..." if cognito_id else None,
                },
            )
            return None, f"Failed to link Cognito account to user: {str(db_error)}", False

    except Exception as e:
        masked_email = mask_email(email) if email else "unknown"
        current_app.logger.error(
            "ENSURE_COGNITO_UNEXPECTED_ERROR",
            extra={
                "request_id": request_id,
                "email": masked_email,
                "error": str(e),
                "error_type": type(e).__name__,
            },
            exc_info=True,
        )
        return None, f"An unexpected error occurred: {str(e)}", False
