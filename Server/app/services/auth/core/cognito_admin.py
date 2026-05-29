"""Cognito admin API: admin_create_user, admin_delete_user, admin_get_user, admin_get_user_status, admin_set_user_password, admin_reset_user_password."""

import logging
import secrets
import string

from botocore.exceptions import ClientError

from ..utils.code_delivery import normalize_cognito_code_delivery

logger = logging.getLogger(__name__)


def admin_create_user(
    client,
    user_pool_id: str,
    username,
    user_attributes,
    temporary_password: str | None = None,
    admin_get_user_fn=None,
):
    """
    Create a user in Cognito using admin privileges.
    If admin_get_user_fn is provided, it is used on UsernameExistsException to return existing user_sub.
    """
    try:
        if temporary_password is None:
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            password_length = 16
            temporary_password = "".join(secrets.choice(alphabet) for _ in range(password_length))
            if not any(c.isupper() for c in temporary_password):
                temporary_password = temporary_password[0].upper() + temporary_password[1:]
            if not any(c.islower() for c in temporary_password):
                temporary_password = temporary_password[0].lower() + temporary_password[1:]
            if not any(c.isdigit() for c in temporary_password):
                temporary_password = temporary_password[:-1] + secrets.choice(string.digits)
            if not any(c in "!@#$%^&*" for c in temporary_password):
                temporary_password = temporary_password[:-1] + secrets.choice("!@#$%^&*")
        response = client.admin_create_user(
            UserPoolId=user_pool_id,
            Username=username,
            UserAttributes=user_attributes,
            TemporaryPassword=temporary_password,
            MessageAction="SUPPRESS",
            DesiredDeliveryMediums=["EMAIL"],
        )
        user_sub = None
        for attr in response.get("User", {}).get("Attributes", []):
            if attr["Name"] == "sub":
                user_sub = attr["Value"]
                break
        if not user_sub:
            user_sub = response.get("User", {}).get("Username")
        logger.info(
            "Admin created user in Cognito",
            extra={
                "username": username[:3] + "***" + username[-3:] if username else "missing",
                "user_sub": user_sub[:8] + "..." if user_sub else "unknown",
            },
        )
        return {"success": True, "user_sub": user_sub, "temporary_password": temporary_password}
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        if error_code == "UsernameExistsException" and admin_get_user_fn:
            logger.warning(
                "User already exists in Cognito, attempting to retrieve",
                extra={"username": username[:3] + "***" + username[-3:] if username else "missing"},
            )
            get_result = admin_get_user_fn(username)
            if get_result.get("success"):
                return {
                    "success": True,
                    "user_sub": get_result["user_sub"],
                    "temporary_password": None,
                    "already_exists": True,
                }
        logger.error(
            "Error creating user in Cognito: %s",
            e,
            extra={
                "error_code": error_code,
                "error_message": error_message,
                "username": username[:3] + "***" + username[-3:] if username else "missing",
            },
        )
        return {"success": False, "error": error_code, "message": error_message}
    except Exception as e:
        logger.error("Unexpected error creating user in Cognito: %s", e, exc_info=True)
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"An unexpected error occurred: {str(e)}",
        }


def admin_delete_user(client, user_pool_id: str, username):
    """Delete a user from Cognito using admin privileges."""
    if not user_pool_id or not username:
        return {
            "success": False,
            "error": "INVALID_INPUT",
            "message": "user_pool_id and username are required",
        }

    try:
        client.admin_delete_user(UserPoolId=user_pool_id, Username=username)
        logger.info(
            "Admin deleted user from Cognito",
            extra={
                "username": username[:3] + "***" + username[-3:] if username else "missing",
            },
        )
        return {"success": True}
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        if error_code == "UserNotFoundException":
            logger.info(
                "Cognito user already absent during delete",
                extra={
                    "username": username[:3] + "***" + username[-3:] if username else "missing",
                },
            )
            return {"success": True, "already_absent": True}
        logger.error(
            "Error deleting user from Cognito: %s",
            e,
            extra={
                "error_code": error_code,
                "error_message": error_message,
                "username": username[:3] + "***" + username[-3:] if username else "missing",
            },
        )
        return {"success": False, "error": error_code, "message": error_message}
    except Exception as e:
        logger.error("Unexpected error deleting user from Cognito: %s", e, exc_info=True)
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"An unexpected error occurred: {str(e)}",
        }


def admin_get_user(client, user_pool_id: str, username):
    """Get user information from Cognito using admin privileges."""
    try:
        response = client.admin_get_user(UserPoolId=user_pool_id, Username=username)
        user_sub = None
        for attr in response.get("UserAttributes", []):
            if attr["Name"] == "sub":
                user_sub = attr["Value"]
                break
        if not user_sub:
            user_sub = response.get("Username")
        logger.info(
            "Retrieved user from Cognito",
            extra={
                "username": username[:3] + "***" + username[-3:] if username else "missing",
                "user_sub": user_sub,
            },
        )
        return {"success": True, "user_sub": user_sub}
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(
            "Error retrieving user from Cognito: %s",
            e,
            extra={
                "error_code": error_code,
                "error_message": error_message,
                "username": username[:3] + "***" + username[-3:] if username else "missing",
            },
        )
        return {"success": False, "error": error_code, "message": error_message}
    except Exception as e:
        logger.error("Unexpected error retrieving user from Cognito: %s", e, exc_info=True)
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"An unexpected error occurred: {str(e)}",
        }


def admin_get_user_status(client, user_pool_id: str, username):
    """Get user status and attributes from Cognito using admin privileges."""
    try:
        response = client.admin_get_user(UserPoolId=user_pool_id, Username=username)
        user_status = response.get("UserStatus", "UNKNOWN")
        user_attributes = response.get("UserAttributes", [])
        email_verified = False
        email_address = None
        for attr in user_attributes:
            if attr.get("Name") == "email_verified":
                email_verified = attr.get("Value", "false").lower() == "true"
            elif attr.get("Name") == "email":
                email_address = attr.get("Value")
        logger.info(
            "Admin retrieved user status from Cognito",
            extra={
                "username": username[:3] + "***" + username[-3:] if username else "missing",
                "user_status": user_status,
                "email_verified": email_verified,
                "has_email": bool(email_address),
            },
        )
        return {
            "success": True,
            "user_status": user_status,
            "email_verified": email_verified,
            "email": email_address,
        }
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(
            "Error retrieving user status from Cognito: %s",
            e,
            extra={
                "error_code": error_code,
                "error_message": error_message,
                "username": username[:3] + "***" + username[-3:] if username else "missing",
            },
        )
        return {"success": False, "error": error_code, "message": error_message}
    except Exception as e:
        logger.error("Unexpected error retrieving user status from Cognito: %s", e, exc_info=True)
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"An unexpected error occurred: {str(e)}",
        }


def admin_set_user_password(client, user_pool_id: str, username, password, permanent: bool = True):
    """Set user password using admin privileges."""
    try:
        client.admin_set_user_password(
            UserPoolId=user_pool_id,
            Username=username,
            Password=password,
            Permanent=permanent,
        )
        logger.info(
            "ADMIN_SET_USER_PASSWORD_SUCCESS",
            extra={
                "username": username[:3] + "***" + username[-3:] if username else "missing",
                "permanent": permanent,
            },
        )
        return {"success": True}
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(
            "ADMIN_SET_USER_PASSWORD_ERROR",
            extra={
                "error_code": error_code,
                "error_message": error_message,
                "username": username[:3] + "***" + username[-3:] if username else "missing",
                "permanent": permanent,
            },
        )
        return {"success": False, "error": error_code, "message": error_message}
    except Exception as e:
        logger.error(
            "ADMIN_SET_USER_PASSWORD_UNEXPECTED_ERROR",
            extra={
                "username": username[:3] + "***" + username[-3:] if username else "missing",
                "error_type": type(e).__name__,
                "error_message": str(e),
            },
            exc_info=True,
        )
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"An unexpected error occurred: {str(e)}",
        }


def admin_reset_user_password(client, user_pool_id: str, username):
    """Reset user password using admin privileges and send reset code via email."""
    try:
        response = client.admin_reset_user_password(UserPoolId=user_pool_id, Username=username)
        logger.info(
            "Admin reset user password in Cognito",
            extra={"username": username[:3] + "***" + username[-3:] if username else "missing"},
        )
        return {
            "success": True,
            "code_delivery": normalize_cognito_code_delivery(response.get("CodeDeliveryDetails")),
        }
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(
            "Error resetting user password in Cognito: %s",
            e,
            extra={
                "error_code": error_code,
                "error_message": error_message,
                "username": username[:3] + "***" + username[-3:] if username else "missing",
            },
        )
        return {"success": False, "error": error_code, "message": error_message}
    except Exception as e:
        logger.error("Unexpected error resetting user password in Cognito: %s", e, exc_info=True)
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": f"An unexpected error occurred: {str(e)}",
        }
