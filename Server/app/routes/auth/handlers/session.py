"""Refresh token and logout handlers."""

from flask import make_response

from app.schemas.generated import EmptyRequest, SuccessResponse
from app.services.auth.flows import handle_refresh_token
from app.services.auth.utils import clear_auth_cookies, generate_request_id
from app.utils.common_patterns import handle_exceptions_with_logging
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response


@rate_limit(max_requests=30, window_seconds=60)
@handle_exceptions_with_logging
@validate_request(EmptyRequest)
def refresh_token(data: EmptyRequest | None = None):
    """Refresh access token using refresh token from HttpOnly cookie"""
    request_id = generate_request_id("refresh_token")
    resp, status_code = handle_refresh_token(request_id)
    return resp, status_code


@rate_limit(max_requests=30, window_seconds=60)
@handle_exceptions_with_logging
@validate_request(EmptyRequest)
@validate_response(SuccessResponse)
def logout(data: EmptyRequest | None = None):
    """Logout user and clear HttpOnly cookies"""
    resp = make_response({"success": True, "message": "Logged out successfully"})
    resp = clear_auth_cookies(resp)
    return resp
