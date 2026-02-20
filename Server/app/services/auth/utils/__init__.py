"""
Authentication utility functions.
"""

from .cookies import clear_auth_cookies, set_auth_cookies
from .helpers import generate_request_id, mask_email, validate_required_fields
from .responses import create_auth_response, create_error_response
from .token_creation import create_minimal_tokens, decode_cognito_token

__all__ = [
    "generate_request_id",
    "validate_required_fields",
    "mask_email",
    "set_auth_cookies",
    "clear_auth_cookies",
    "create_auth_response",
    "create_error_response",
    "create_minimal_tokens",
    "decode_cognito_token",
]
