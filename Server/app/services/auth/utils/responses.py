"""
Response creation utilities for authentication.
"""

from flask import Response, make_response

from app.models import User
from app.services.auth.user_role_helpers import user_role_names
from logger import log


def create_error_response(error: str, message: str, status_code: int = 400) -> tuple:
    """Create standardized error response."""
    return ({"success": False, "error": error, "message": message}, status_code)


def create_auth_response(
    user: User | None,
    user_sub: str,
    email: str,
    access_token: str,
    id_token: str,
    message: str | None = None,
    include_id_token: bool = True,
) -> Response:
    """
    Create a standardized authentication response with user data and cookies.
    """
    auth_method = "unknown"
    if user:
        has_cognito = bool(user.cognito_id)
        has_google = bool(user.google_id)
        if has_cognito and has_google:
            auth_method = "both"
        elif has_google:
            auth_method = "google"
        elif has_cognito:
            auth_method = "cognito"
    if auth_method == "unknown":
        log.info("AUTH", f"auth_method_unknown_session has_user_row={user is not None}")
    response_data = {
        "success": True,
        "user": {
            "auth_user_kind": "session",
            "email": email,
            "user_sub": user_sub,
            "name": user.name if user else "Unknown User",
            "id": str(user.id) if user else None,
            "phone": user.phone if user else None,
            "roles": user_role_names(user) if user else [],
            "auth_method": auth_method,
        },
    }
    if message:
        response_data["message"] = message
    if include_id_token:
        response_data["id_token"] = id_token
    resp = make_response(response_data)
    return resp
