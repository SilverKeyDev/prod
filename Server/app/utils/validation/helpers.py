"""
Helper utilities for OpenAPI validation.

Provides utilities for working with Pydantic validation errors,
schema discovery, and validation reporting.
"""

from typing import Any

from pydantic import BaseModel, ValidationError

# Field path segments that must never appear in log payloads (Pydantic ``input`` values).
_SENSITIVE_LOC_SEGMENTS = frozenset(
    {
        "password",
        "token",
        "secret",
        "authorization",
        "credential",
        "credentials",
        "api_key",
        "apikey",
        "refresh_token",
        "access_token",
        "id_token",
    }
)


def sanitize_validation_errors_for_log(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Strip Pydantic validation error payloads before logging.

    ``ValidationError.errors()`` includes an ``input`` field with the rejected value,
    which can contain passwords, tokens, and API keys. Logs must only carry loc/msg/type.
    """
    sanitized: list[dict[str, Any]] = []
    for err in errors:
        loc = err.get("loc") or ()
        loc_segments = {str(segment).lower() for segment in loc}
        entry: dict[str, Any] = {
            "loc": list(loc) if isinstance(loc, tuple) else loc,
            "msg": err.get("msg"),
            "type": err.get("type"),
        }
        if "input" in err:
            if loc_segments & _SENSITIVE_LOC_SEGMENTS:
                entry["input"] = "[REDACTED]"
            else:
                entry["input"] = "[OMITTED]"
        sanitized.append(entry)
    return sanitized


def format_validation_errors(errors: list[dict[str, Any]]) -> dict[str, str]:
    """
    Format Pydantic validation errors for user-friendly display.

    Converts Pydantic error list into field -> message dict
    suitable for SecureErrorHandler.

    Args:
        errors: List of Pydantic validation errors from e.errors()

    Returns:
        Dict mapping field names to error messages

    Example:
        errors = [
            {"loc": ("email",), "msg": "field required", "type": "value_error.missing"},
            {"loc": ("password",), "msg": "field required", "type": "value_error.missing"}
        ]
        result = format_validation_errors(errors)
        # {"email": "field required", "password": "field required"}
    """
    field_errors = {}

    for err in errors:
        # Get field path from location tuple
        field_path = ".".join(str(loc) for loc in err["loc"])

        # Get error message
        message = err.get("msg", "Invalid value")

        # Clean up message for user display
        if message.startswith("Field required"):
            message = "This field is required"
        elif message.startswith("value is not a valid"):
            message = "Invalid format"

        field_errors[field_path] = message

    return field_errors


def validate_response_data(
    data: dict[str, Any], schema: type[BaseModel]
) -> tuple[bool, list[dict[str, Any]]]:
    """
    Validate response data without raising exceptions.

    Useful for checking if data matches schema before returning.

    Args:
        data: Response data dict to validate
        schema: Pydantic model class to validate against

    Returns:
        Tuple of (is_valid, errors)
        - is_valid: True if data matches schema
        - errors: List of validation errors (empty if valid)

    Example:
        is_valid, errors = validate_response_data(user_dict, UserProfile)
        if not is_valid:
            log.error("Invalid user data", {"errors": errors})
    """
    try:
        schema(**data)
        return True, []
    except ValidationError as e:
        return False, e.errors()


def get_validation_summary(errors: list[dict[str, Any]]) -> str:
    """
    Generate human-readable summary of validation errors.

    Args:
        errors: List of Pydantic validation errors

    Returns:
        Human-readable error summary

    Example:
        summary = get_validation_summary(e.errors())
        # "3 validation errors: email (field required), password (field required), ..."
    """
    if not errors:
        return "No validation errors"

    error_count = len(errors)
    error_summaries = []

    for err in errors[:3]:  # Show first 3 errors
        field = ".".join(str(loc) for loc in err["loc"])
        msg = err.get("msg", "invalid")
        error_summaries.append(f"{field} ({msg})")

    summary = f"{error_count} validation error{'s' if error_count != 1 else ''}: "
    summary += ", ".join(error_summaries)

    if error_count > 3:
        summary += f", and {error_count - 3} more"

    return summary


def extract_required_fields(schema: type[BaseModel]) -> list[str]:
    """
    Extract required field names from Pydantic schema.

    Args:
        schema: Pydantic model class

    Returns:
        List of required field names

    Example:
        required = extract_required_fields(LoginData)
        # ["email", "password"]
    """
    if not hasattr(schema, "model_fields"):
        return []

    required_fields = []
    for field_name, field_info in schema.model_fields.items():
        if field_info.is_required():
            required_fields.append(field_name)

    return required_fields


def create_validation_error_response(e: ValidationError, request_path: str) -> dict[str, Any]:
    """
    Create standardized validation error response.

    Args:
        e: Pydantic ValidationError
        request_path: Request path for logging context

    Returns:
        Dict suitable for JSON response

    Example:
        try:
            data = LoginData(**request.json)
        except ValidationError as e:
            return jsonify(create_validation_error_response(e, request.path)), 400
    """
    field_errors = format_validation_errors(e.errors())
    summary = get_validation_summary(e.errors())

    return {
        "success": False,
        "error": "validation_error",
        "message": "Invalid input provided",
        "field_errors": field_errors,
        "summary": summary,
    }
