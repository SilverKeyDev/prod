"""Cognito refresh access token flow."""

import logging
import random
import time
from collections.abc import Callable
from datetime import datetime

from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


def refresh_access_token(
    client,
    client_id: str,
    get_secret_hash: Callable[[str], str],
    refresh_token: str,
    username: str | None = None,
    get_username_fallback: Callable[[], str | None] | None = None,
):
    """Refresh access token using Cognito refresh token."""
    request_id = f"AWS_COGNITO_refresh_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    start_time = time.time()

    def duration_ms():
        return int((time.time() - start_time) * 1000)

    try:
        if not refresh_token:
            logger.error(
                "AWS_COGNITO_REFRESH_VALIDATION_ERROR",
                extra={
                    "request_id": request_id,
                    "error": "Missing refresh token",
                    "duration_ms": duration_ms(),
                },
            )
            return {
                "success": False,
                "error": "MISSING_REFRESH_TOKEN",
                "message": "Refresh token is required",
                "refresh_failed": True,
            }
        try:
            if username:
                secret_hash = get_secret_hash(username)
            elif get_username_fallback:
                username = get_username_fallback()
                if username:
                    secret_hash = get_secret_hash(username)
                else:
                    secret_hash = get_secret_hash(client_id)
            else:
                secret_hash = get_secret_hash(client_id)
            logger.debug(
                "AWS_COGNITO_REFRESH_SECRET_HASH_GENERATED",
                extra={
                    "request_id": request_id,
                    "secret_hash_length": len(secret_hash),
                    "has_username": bool(username),
                },
            )
        except Exception as hash_error:
            logger.error(
                "AWS_COGNITO_REFRESH_SECRET_HASH_ERROR",
                extra={
                    "request_id": request_id,
                    "error": str(hash_error),
                    "duration_ms": duration_ms(),
                },
            )
            return {
                "success": False,
                "error": "SECRET_HASH_ERROR",
                "message": "Failed to generate authentication hash",
                "refresh_failed": True,
            }
        response = client.initiate_auth(
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={"REFRESH_TOKEN": refresh_token, "SECRET_HASH": secret_hash},
            ClientId=client_id,
        )
        logger.info(
            "AWS_COGNITO_REFRESH_SUCCESS",
            extra={"request_id": request_id, "duration_ms": duration_ms()},
        )
        return {"success": True, "tokens": response["AuthenticationResult"]}
    except ClientError as e:
        dm = duration_ms()
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(
            "AWS_COGNITO_REFRESH_CLIENT_ERROR",
            extra={
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
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
        if error_code == "NotAuthorizedException":
            return {
                "success": False,
                "error": "REFRESH_TOKEN_EXPIRED",
                "message": "Refresh token has expired. Please log in again.",
                "refresh_failed": True,
            }
        if error_code == "InvalidParameterException":
            return {
                "success": False,
                "error": "REFRESH_TOKEN_INVALID",
                "message": "Invalid refresh token. Please log in again.",
                "refresh_failed": True,
            }
        return {
            "success": False,
            "error": error_code,
            "message": error_message,
            "refresh_failed": True,
        }
    except Exception as e:
        logger.error(
            "AWS_COGNITO_REFRESH_UNEXPECTED_ERROR",
            extra={
                "request_id": request_id,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "duration_ms": duration_ms(),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred during token refresh. Please try again.",
            "refresh_failed": True,
        }
