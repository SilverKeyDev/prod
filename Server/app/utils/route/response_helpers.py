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


def standardize_error_response(error_message, status_code=400, error_code=None):
    """
    Create standardized error response format.
    Eliminates repeated error response patterns.
    """
    response = {"success": False, "error": error_message}

    if error_code:
        response["error_code"] = error_code

    return jsonify(response), status_code
