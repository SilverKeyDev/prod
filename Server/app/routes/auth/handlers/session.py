"""Refresh token and logout handlers."""

import traceback

from flask import current_app, jsonify, make_response

from app.schemas.generated import SuccessResponse
from app.services.auth.flows import handle_refresh_token
from app.services.auth.utils import clear_auth_cookies, create_error_response, generate_request_id
from app.utils.validation import validate_response


def refresh_token():
    """Refresh access token using refresh token from HttpOnly cookie"""
    request_id = generate_request_id("refresh_token")
    try:
        resp, status_code = handle_refresh_token(request_id)
        return resp, status_code
    except Exception as e:
        current_app.logger.error(
            "AUTH_REFRESH_EXCEPTION",
            extra={
                "request_id": request_id,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc()[:500],
            },
        )
        error_response, status_code = create_error_response(
            "REFRESH_FAILED", "Failed to refresh token"
        )
        return jsonify(error_response), status_code


@validate_response(SuccessResponse)
def logout():
    """Logout user and clear HttpOnly cookies"""
    try:
        resp = make_response({"success": True, "message": "Logged out successfully"})
        resp = clear_auth_cookies(resp)
        return resp
    except Exception as e:
        current_app.logger.error(f"Error during logout: {str(e)}")
        error_response, status_code = create_error_response(
            "LOGOUT_FAILED", "Failed to logout user"
        )
        return jsonify(error_response), status_code
