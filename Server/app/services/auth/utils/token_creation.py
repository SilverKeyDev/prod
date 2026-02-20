"""
Token creation helper utilities.
"""

from typing import Any

import jwt

from ..core.minimal_token_service import minimal_token_service


def create_minimal_tokens(
    user_id: str,
    user_email: str,
    user_name: str = "Unknown User",
    expires_in_hours: int = 8,
    fallback_access_token: str | None = None,
    fallback_id_token: str | None = None,
) -> tuple[str, str]:
    """
    Create minimal access and ID tokens.
    Falls back to provided tokens if creation fails.
    ID token creation is optional and will silently fall back if RS256 is not configured.
    Returns (access_token, id_token).
    """
    # Generate minimal access token (required)
    try:
        minimal_access_token = minimal_token_service.create_minimal_access_token(
            user_id=user_id, user_email=user_email, expires_in_hours=expires_in_hours
        )
    except Exception:
        # Fallback to provided access token if available
        minimal_access_token = fallback_access_token or ""

    # Generate minimal ID token (optional - RS256 key may not be configured)
    minimal_id_token = fallback_id_token or ""
    try:
        minimal_id_token = minimal_token_service.create_minimal_id_token(
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
            expires_in_hours=expires_in_hours,
        )
    except Exception:
        # Silently fall back to provided ID token if available
        if fallback_id_token:
            minimal_id_token = fallback_id_token

    return minimal_access_token, minimal_id_token


def decode_cognito_token(token: str) -> dict[str, Any]:
    """
    Decode a Cognito JWT token without verification.
    Returns the decoded payload.
    """
    return jwt.decode(token, options={"verify_signature": False})
