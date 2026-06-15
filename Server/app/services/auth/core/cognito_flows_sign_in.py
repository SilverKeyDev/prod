"""Cognito sign-in flow."""

import random
import time
from collections.abc import Callable
from datetime import datetime, timezone

from botocore.exceptions import ClientError

from logger import log


def sign_in(client, client_id: str, get_secret_hash: Callable[[str], str], username, password):
    """Authenticate user and get tokens."""
    request_id = f"AWS_COGNITO_signin_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    start_time = time.time()

    def duration_ms():
        return int((time.time() - start_time) * 1000)

    try:
        if not username:
            log.error(
                "ERRORS",
                "AWS_COGNITO_SIGNIN_VALIDATION_ERROR",
                {
                    "request_id": request_id,
                    "error": "Missing username",
                    "duration_ms": duration_ms(),
                },
            )
            return {
                "success": False,
                "error": "MISSING_USERNAME",
                "message": "Username is required",
                "login_failed": True,
            }
        if not password:
            log.error(
                "ERRORS",
                "AWS_COGNITO_SIGNIN_VALIDATION_ERROR",
                {
                    "request_id": request_id,
                    "error": "Missing password",
                    "duration_ms": duration_ms(),
                },
            )
            return {
                "success": False,
                "error": "MISSING_PASSWORD",
                "message": "Password is required",
                "login_failed": True,
            }
        try:
            secret_hash = get_secret_hash(username)
            log.debug(
                "AUTH",
                "AWS_COGNITO_SECRET_HASH_GENERATED",
                {"request_id": request_id, "secret_hash_length": len(secret_hash)},
            )
        except Exception as hash_error:
            log.error(
                "ERRORS",
                "AWS_COGNITO_SECRET_HASH_ERROR",
                {"request_id": request_id, "error": str(hash_error), "duration_ms": duration_ms()},
            )
            return {
                "success": False,
                "error": "SECRET_HASH_ERROR",
                "message": "Failed to generate authentication hash",
                "login_failed": True,
            }
        response = client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": username, "PASSWORD": password, "SECRET_HASH": secret_hash},
            ClientId=client_id,
        )
        return {"success": True, "tokens": response["AuthenticationResult"]}
    except ClientError as e:
        dm = duration_ms()
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        log.error(
            "ERRORS",
            "AWS_COGNITO_SIGNIN_CLIENT_ERROR",
            {
                "request_id": request_id,
                "error_code": error_code,
                "error_message": error_message,
                "http_status_code": e.response.get("ResponseMetadata", {}).get(
                    "HTTPStatusCode", "unknown"
                ),
                "request_id_cognito": e.response.get("ResponseMetadata", {}).get(
                    "RequestId", "unknown"
                ),
                "duration_ms": dm,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        if error_code == "NotAuthorizedException":
            return {
                "success": False,
                "error": error_code,
                "message": "Incorrect email or password. Please try again.",
                "login_failed": True,
            }
        if error_code == "UserNotFoundException":
            return {
                "success": False,
                "error": error_code,
                "message": "No account found with this email address.",
                "login_failed": True,
            }
        if error_code == "TooManyRequestsException":
            return {
                "success": False,
                "error": error_code,
                "message": "Too many login attempts. Please try again later.",
                "login_failed": True,
            }
        if error_code == "UserNotConfirmedException":
            return {
                "success": False,
                "error": error_code,
                "message": "Please verify your email address to continue.",
                "login_failed": True,
                "needs_verification": True,
            }
        return {
            "success": False,
            "error": error_code,
            "message": error_message,
            "login_failed": True,
        }
    except Exception as e:
        log.error(
            "ERRORS",
            "AWS_COGNITO_SIGNIN_UNEXPECTED_ERROR",
            {
                "request_id": request_id,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "duration_ms": duration_ms(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
            "login_failed": True,
        }
