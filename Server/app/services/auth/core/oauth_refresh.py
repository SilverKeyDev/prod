"""
Google OAuth token refresh (HTTP and response mapping).
"""

import time
import uuid

import requests

from app.utils.security.app_logging import get_logger

logger = get_logger()


def refresh_google_access_token(
    session,
    token_endpoint: str,
    client_id: str,
    client_secret: str,
    refresh_token: str,
) -> dict:
    """
    Refresh Google OAuth access token using refresh token.
    Returns the same success/error dict shape as GoogleOAuthService.refresh_access_token.
    """
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    try:
        if not refresh_token:
            logger.error(
                "GOOGLE_REFRESH_VALIDATION_ERROR",
                extra={
                    "request_id": request_id,
                    "error": "Missing refresh token",
                    "duration_ms": int((time.time() - start_time) * 1000),
                },
            )
            return {
                "success": False,
                "error": "MISSING_REFRESH_TOKEN",
                "message": "Refresh token is required",
                "refresh_failed": True,
            }

        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        response = None
        for attempt in range(2):
            try:
                response = session.post(token_endpoint, data=token_data)
                break
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                if attempt == 0:
                    time.sleep(1.0)
                    continue
                duration_ms = int((time.time() - start_time) * 1000)
                logger.warning(
                    "GOOGLE_REFRESH_NETWORK_ERROR",
                    extra={
                        "request_id": request_id,
                        "error_type": type(e).__name__,
                        "error_message": str(e),
                        "duration_ms": duration_ms,
                    },
                )
                return {
                    "success": False,
                    "error": "GOOGLE_REFRESH_NETWORK_ERROR",
                    "message": "Unable to reach Google. Please check your connection and try again.",
                    "refresh_failed": True,
                    "retryable": True,
                }

        duration_ms = int((time.time() - start_time) * 1000)

        if response is None:
            return {
                "success": False,
                "error": "GOOGLE_REFRESH_NO_RESPONSE",
                "message": "No response from Google. Please try again.",
                "refresh_failed": True,
            }
        if response.status_code != 200:
            error_data = {}
            try:
                error_data = response.json()
            except Exception:
                error_data = {"error": response.text[:200]}

            error_code = error_data.get("error", "UNKNOWN_ERROR")
            error_description = error_data.get("error_description", response.text[:200])

            logger.error(
                "GOOGLE_REFRESH_FAILED",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "error_code": error_code,
                    "error_description": error_description,
                    "duration_ms": duration_ms,
                },
            )

            if error_code == "invalid_grant":
                return {
                    "success": False,
                    "error": "GOOGLE_REFRESH_TOKEN_EXPIRED",
                    "message": "Google refresh token has expired. Please log in again.",
                    "refresh_failed": True,
                }
            if error_code == "invalid_token":
                return {
                    "success": False,
                    "error": "GOOGLE_REFRESH_TOKEN_INVALID",
                    "message": "Invalid Google refresh token. Please log in again.",
                    "refresh_failed": True,
                }
            return {
                "success": False,
                "error": "GOOGLE_REFRESH_FAILED",
                "message": f"Google token refresh failed: {error_description}",
                "refresh_failed": True,
            }

        tokens = response.json()

        logger.info(
            "GOOGLE_REFRESH_SUCCESS",
            extra={
                "request_id": request_id,
                "has_access_token": bool(tokens.get("access_token")),
                "has_refresh_token": bool(tokens.get("refresh_token")),
                "expires_in": tokens.get("expires_in"),
                "duration_ms": duration_ms,
            },
        )

        return {
            "success": True,
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "expires_in": tokens.get("expires_in", 3600),
            "token_type": tokens.get("token_type", "Bearer"),
        }

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(
            "GOOGLE_REFRESH_UNEXPECTED_ERROR",
            extra={
                "request_id": request_id,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "duration_ms": duration_ms,
            },
            exc_info=True,
        )
        return {
            "success": False,
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred during Google token refresh. Please try again.",
            "refresh_failed": True,
        }
