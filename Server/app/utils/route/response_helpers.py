"""Standardized Flask JSON success and error responses."""

from flask import jsonify


def standardize_success_response(data=None, message="Success", status_code=200):
    """
    Create standardized success response format.
    Eliminates repeated success response patterns.
    """
    response = {"success": True, "message": message}

    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response["data"] = data

    return jsonify(response), status_code


def standardize_error_response(
    message: str,
    status_code: int = 400,
    error_code: str = "invalid_request",
):
    """
    Create standardized error response format aligned with OpenAPI ErrorResponse.

    ``error`` is a stable machine code; ``message`` is safe to show to users.
    """
    response = {
        "success": False,
        "error": error_code,
        "message": message,
    }

    return jsonify(response), status_code
