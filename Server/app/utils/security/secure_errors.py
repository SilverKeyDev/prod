"""
Secure error handling utilities to prevent information disclosure.
"""

import logging
import traceback
import uuid
from typing import Any

from flask import jsonify

logger = logging.getLogger(__name__)

# Generic error messages that don't leak system information
GENERIC_ERROR_MESSAGES = {
    "authentication_failed": "Authentication required",
    "authorization_failed": "Access denied",
    "invalid_request": "Invalid request",
    "resource_not_found": "Resource not found",
    "validation_error": "Invalid input provided",
    "server_error": "An error occurred processing your request",
    "rate_limit_exceeded": "Too many requests. Please try again later.",
    "file_upload_error": "File upload failed",
    "database_error": "Unable to process request",
    "external_api_error": "External service temporarily unavailable",
    "configuration_error": "Service temporarily unavailable",
    "agreement_state_error": "Agreement cannot be sent in its current state",
    "agreement_not_found": "Agreement not found",
    "participant_not_found": "Participant not found",
    "revision_not_found": "Agreement revision not found",
    "template_not_found": "Template not found",
    "docusign_error": "Document signing service error",
}


class SecureErrorHandler:
    """Handles errors securely without leaking sensitive information."""

    @staticmethod
    def generate_error_id() -> str:
        """Generate unique error ID for tracking."""
        return str(uuid.uuid4())[:8]

    @staticmethod
    def log_error_details(error_id: str, error: Exception, context: dict[str, Any] | None = None):
        """Log detailed error information for debugging (server-side only)."""
        context_str = f" | Context: {context}" if context else ""

        # Format traceback if available on the exception
        tb_lines = []
        if hasattr(error, "__traceback__") and error.__traceback__:
            tb_lines = traceback.format_exception(type(error), error, error.__traceback__)

        # Log with full details
        error_msg = f"Error {error_id} [{type(error).__name__}]: {str(error)}{context_str}"
        if tb_lines:
            logger.error(f"{error_msg}\n{'=' * 80}\n{''.join(tb_lines)}{'=' * 80}")
        else:
            # Try to use exc_info if we're still in exception context
            import sys

            if sys.exc_info()[0] is not None:
                logger.error(error_msg, exc_info=True)
            else:
                logger.error(error_msg)

    @staticmethod
    def create_secure_response(
        error_type: str,
        status_code: int = 500,
        error_id: str | None = None,
        additional_info: dict[str, Any] | None = None,
    ) -> tuple:
        """
        Create secure error response that doesn't leak sensitive information.

        Args:
            error_type: Type of error from GENERIC_ERROR_MESSAGES
            status_code: HTTP status code
            error_id: Optional error ID for tracking
            additional_info: Safe additional information to include

        Returns:
            Tuple of (response, status_code)
        """
        error_id = error_id or SecureErrorHandler.generate_error_id()

        response = {
            "success": False,
            "error": error_type,
            "message": GENERIC_ERROR_MESSAGES.get(
                error_type, GENERIC_ERROR_MESSAGES["server_error"]
            ),
            "error_id": error_id,
        }

        # Only include safe additional information
        if additional_info:
            safe_keys = [
                "field_errors",
                "validation_errors",
                "retry_after",
                "allowed_types",
                "message",
            ]
            for key, value in additional_info.items():
                if key in safe_keys:
                    response[key] = value

        return jsonify(response), status_code

    @staticmethod
    def handle_database_error(error: Exception, context: dict[str, Any] | None = None) -> tuple:
        """Handle database errors securely."""
        error_id = SecureErrorHandler.generate_error_id()
        SecureErrorHandler.log_error_details(error_id, error, context)

        # Never expose database schema or connection details
        return SecureErrorHandler.create_secure_response("database_error", 500, error_id)

    @staticmethod
    def handle_validation_error(
        error: Exception,
        field_errors: dict[str, str] | None = None,
        context: dict[str, Any] | None = None,
    ) -> tuple:
        """Handle validation errors securely."""
        error_id = SecureErrorHandler.generate_error_id()
        SecureErrorHandler.log_error_details(error_id, error, context)

        additional_info = {}
        if field_errors:
            # Only include field names and generic error messages
            safe_field_errors = {}
            for field, message in field_errors.items():
                # Sanitize field names and error messages
                safe_field = field.replace("_", " ").title()
                safe_message = message if len(message) < 100 else "Invalid value"
                safe_field_errors[safe_field] = safe_message
            additional_info["field_errors"] = safe_field_errors

        return SecureErrorHandler.create_secure_response(
            "validation_error", 400, error_id, additional_info
        )

    @staticmethod
    def handle_external_api_error(
        error: Exception, api_name: str | None = None, context: dict[str, Any] | None = None
    ) -> tuple:
        """Handle external API errors securely."""
        error_id = SecureErrorHandler.generate_error_id()

        # Log with API details but don't expose to user
        api_context = context or {}
        if api_name:
            api_context["api_name"] = api_name

        SecureErrorHandler.log_error_details(error_id, error, api_context)

        return SecureErrorHandler.create_secure_response("external_api_error", 503, error_id)

    @staticmethod
    def handle_file_upload_error(error: Exception, context: dict[str, Any] | None = None) -> tuple:
        """Handle file upload errors securely."""
        error_id = SecureErrorHandler.generate_error_id()
        SecureErrorHandler.log_error_details(error_id, error, context)

        # Provide helpful but not sensitive information
        additional_info = {}
        error_message = str(error).lower()

        if "file type" in error_message or "mime" in error_message:
            additional_info["allowed_types"] = list(GENERIC_ERROR_MESSAGES.keys())
        elif "size" in error_message:
            additional_info["message"] = "File size exceeds maximum allowed"
        elif "virus" in error_message or "malicious" in error_message:
            additional_info["message"] = "File failed security scan"

        return SecureErrorHandler.create_secure_response(
            "file_upload_error", 400, error_id, additional_info
        )

    @staticmethod
    def handle_configuration_error(
        error: Exception, context: dict[str, Any] | None = None
    ) -> tuple:
        """Handle configuration errors securely."""
        error_id = SecureErrorHandler.generate_error_id()
        SecureErrorHandler.log_error_details(error_id, error, context)

        # Never expose configuration details to users
        return SecureErrorHandler.create_secure_response("configuration_error", 503, error_id)

    @staticmethod
    def handle_docusign_error(
        error: Exception,
        error_type: str = "docusign_error",
        status_code: int = 400,
        context: dict[str, Any] | None = None,
    ) -> tuple:
        """Handle DocuSign-related errors securely."""
        error_id = SecureErrorHandler.generate_error_id()
        SecureErrorHandler.log_error_details(error_id, error, context)

        # Provide user-friendly messages for common DocuSign errors
        return SecureErrorHandler.create_secure_response(error_type, status_code, error_id)

    @staticmethod
    def handle_error(
        error: Exception, message: str | None = None, context: dict[str, Any] | None = None
    ) -> tuple:
        """Generic error handler that securely handles any exception."""
        error_id = SecureErrorHandler.generate_error_id()
        SecureErrorHandler.log_error_details(error_id, error, context)

        # Determine error type based on exception
        error_type = "server_error"
        status_code = 500

        # Check for specific error types
        error_str = str(error).lower()
        if "authentication" in error_str or "unauthorized" in error_str:
            error_type = "authentication_failed"
            status_code = 401
        elif "authorization" in error_str or "forbidden" in error_str:
            error_type = "authorization_failed"
            status_code = 403
        elif "not found" in error_str:
            error_type = "resource_not_found"
            status_code = 404
        elif "validation" in error_str or "invalid" in error_str:
            error_type = "validation_error"
            status_code = 400

        # Use provided message or generic message
        response = {
            "success": False,
            "error": error_type,
            "message": message
            or GENERIC_ERROR_MESSAGES.get(error_type, GENERIC_ERROR_MESSAGES["server_error"]),
            "error_id": error_id,
        }

        return jsonify(response), status_code


def sanitize_error_message(message: str) -> str:
    """
    Sanitize error message to remove sensitive information.

    Args:
        message: Original error message

    Returns:
        Sanitized error message
    """
    # Remove file paths
    import re

    message = re.sub(r"/[^\s]*", "[PATH]", message)

    # Remove IP addresses
    message = re.sub(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", "[IP]", message)

    # Remove database connection strings
    message = re.sub(r"postgresql://[^\s]*", "[DATABASE_URL]", message)
    message = re.sub(r"mysql://[^\s]*", "[DATABASE_URL]", message)

    # Remove API keys (common patterns)
    message = re.sub(r"[Aa][Pp][Ii]_?[Kk][Ee][Yy][:\s=]+[^\s]+", "[API_KEY]", message)
    message = re.sub(r"[Tt][Oo][Kk][Ee][Nn][:\s=]+[^\s]+", "[TOKEN]", message)

    # Remove email addresses
    message = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL]", message)

    # Limit message length
    if len(message) > 200:
        message = message[:200] + "..."

    return message


# Decorator for secure error handling
def secure_error_handler(error_type: str = "server_error"):
    """
    Decorator to wrap functions with secure error handling.

    Args:
        error_type: Default error type for unhandled exceptions
    """

    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_id = SecureErrorHandler.generate_error_id()
                SecureErrorHandler.log_error_details(
                    error_id, e, {"function": func.__name__, "args": str(args)[:100]}
                )
                return SecureErrorHandler.create_secure_response(error_type, 500, error_id)

        return wrapper

    return decorator
