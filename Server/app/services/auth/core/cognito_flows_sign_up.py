"""Cognito sign-up and confirm sign-up flows."""

from collections.abc import Callable

from botocore.exceptions import ClientError

from logger import log

from ..utils.code_delivery import normalize_cognito_code_delivery


def sign_up(
    client,
    client_id: str,
    get_secret_hash: Callable[[str], str],
    username,
    password,
    user_attributes,
):
    """Register a new user."""
    try:
        response = client.sign_up(
            ClientId=client_id,
            SecretHash=get_secret_hash(username),
            Username=username,
            Password=password,
            UserAttributes=user_attributes,
        )
        return {
            "success": True,
            "user_sub": response["UserSub"],
            "code_delivery": normalize_cognito_code_delivery(response["CodeDeliveryDetails"]),
        }
    except ClientError as e:
        log.error("ERRORS", f"Error signing up user: {e}", e)
        return {
            "success": False,
            "error": e.response["Error"]["Code"],
            "message": e.response["Error"]["Message"],
        }


def confirm_sign_up(
    client, client_id: str, get_secret_hash: Callable[[str], str], username, confirmation_code
):
    """Confirm user registration with verification code."""
    try:
        client.confirm_sign_up(
            ClientId=client_id,
            SecretHash=get_secret_hash(username),
            Username=username,
            ConfirmationCode=confirmation_code,
        )
        return {"success": True}
    except ClientError as e:
        log.error("ERRORS", f"Error confirming sign up: {e}", e)
        return {
            "success": False,
            "error": e.response["Error"]["Code"],
            "message": e.response["Error"]["Message"],
        }
