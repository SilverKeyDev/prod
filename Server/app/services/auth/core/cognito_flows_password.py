"""Cognito forgot-password and confirm-forgot-password flows."""

import logging
import random
import time
from collections.abc import Callable

from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


def forgot_password(
    client,
    client_id: str,
    get_secret_hash: Callable[[str], str],
    username,
    request_id: str | None = None,
    user_status: str | None = None,
):
    """Initiate forgot password flow."""
    local_request_id = (
        request_id or f"AWS_COGNITO_forgot_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    )
    start_time = time.time()
    masked_username = username[:3] + "***" + username[-3:] if username else "missing"
    try:
        logger.info(
            "FORGOT_PASSWORD_COGNITO_CALL_START",
            extra={
                "request_id": local_request_id,
                "username": masked_username,
                "user_status_at_call_time": user_status,
            },
        )
        response = client.forgot_password(
            ClientId=client_id,
            SecretHash=get_secret_hash(username),
            Username=username,
        )
        duration_ms = int((time.time() - start_time) * 1000)
        metadata = response.get("ResponseMetadata", {}) or {}
        code_delivery = response.get("CodeDeliveryDetails", {}) or {}
        delivery_medium = code_delivery.get("DeliveryMedium", "UNKNOWN")
        destination = code_delivery.get("Destination", "UNKNOWN")
        attribute_name = code_delivery.get("AttributeName", "UNKNOWN")
        logger.info(
            "FORGOT_PASSWORD_EMAIL_DELIVERY_INFO",
            extra={
                "request_id": local_request_id,
                "username": masked_username,
                "user_status_at_call_time": user_status,
                "delivery_medium": delivery_medium,
                "destination": destination[:3] + "***" + destination[-3:]
                if destination and destination != "UNKNOWN"
                else destination,
                "attribute_name": attribute_name,
                "has_code_delivery": bool(code_delivery),
                "code_delivery_keys": list(code_delivery.keys()) if code_delivery else [],
                "aws_request_id": metadata.get("RequestId"),
                "aws_http_status": metadata.get("HTTPStatusCode"),
                "aws_retry_attempts": metadata.get("RetryAttempts"),
                "duration_ms": duration_ms,
            },
        )
        if delivery_medium not in ["EMAIL", "SMS"]:
            logger.warning(
                "FORGOT_PASSWORD_UNEXPECTED_DELIVERY_MEDIUM",
                extra={
                    "request_id": local_request_id,
                    "username": masked_username,
                    "delivery_medium": delivery_medium,
                    "expected": "EMAIL or SMS",
                    "user_status_at_call_time": user_status,
                },
            )
        if destination == "UNKNOWN" or not destination:
            logger.warning(
                "FORGOT_PASSWORD_NO_DESTINATION",
                extra={
                    "request_id": local_request_id,
                    "username": masked_username,
                    "code_delivery": code_delivery,
                    "user_status_at_call_time": user_status,
                },
            )
        if not code_delivery:
            logger.warning(
                "FORGOT_PASSWORD_NO_CODE_DELIVERY_DETAILS",
                extra={
                    "request_id": local_request_id,
                    "username": masked_username,
                    "aws_request_id": metadata.get("RequestId"),
                    "aws_http_status": metadata.get("HTTPStatusCode"),
                    "user_status_at_call_time": user_status,
                },
            )
        return {
            "success": True,
            "code_delivery": code_delivery,
            "delivery_medium": delivery_medium,
            "destination": destination,
            "attribute_name": attribute_name,
            "aws_request_id": metadata.get("RequestId"),
            "aws_http_status": metadata.get("HTTPStatusCode"),
        }
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        metadata = e.response.get("ResponseMetadata", {}) or {}
        logger.error(
            "FORGOT_PASSWORD_COGNITO_ERROR: %s - %s",
            error_code,
            error_message,
            extra={
                "request_id": local_request_id,
                "username": masked_username,
                "error_code": error_code,
                "error_message": error_message,
                "http_status": metadata.get("HTTPStatusCode", "unknown"),
                "aws_request_id": metadata.get("RequestId"),
            },
        )
        return {
            "success": False,
            "error": error_code,
            "message": error_message,
            "aws_request_id": metadata.get("RequestId"),
            "aws_http_status": metadata.get("HTTPStatusCode"),
        }
    except Exception as e:
        logger.error(
            "FORGOT_PASSWORD_UNEXPECTED_ERROR",
            extra={
                "request_id": local_request_id,
                "username": masked_username,
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


def confirm_forgot_password(
    client,
    client_id: str,
    get_secret_hash: Callable[[str], str],
    username,
    confirmation_code,
    new_password,
):
    """Confirm forgot password with code and set new password."""
    try:
        client.confirm_forgot_password(
            ClientId=client_id,
            SecretHash=get_secret_hash(username),
            Username=username,
            ConfirmationCode=confirmation_code,
            Password=new_password,
        )
        return {"success": True}
    except ClientError as e:
        logger.error("Error confirming forgot password: %s", e)
        return {
            "success": False,
            "error": e.response["Error"]["Code"],
            "message": e.response["Error"]["Message"],
        }
