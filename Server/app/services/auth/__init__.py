"""
Authentication services module.
Provides clean imports for all authentication functionality.
"""

# Core services
from .core import (
    AWS_COGNITO_service,
    CognitoService,
    GoogleOAuthService,
    MinimalTokenService,
    google_oauth_service,
    minimal_token_service,
)

# Flow handlers
from .flows import (
    ensure_cognito_account_for_user,
    handle_google_oauth_callback,
    handle_login,
    handle_refresh_token,
    handle_resend_code,
    handle_signup,
    handle_verification,
)

# Token management
from .tokens import (
    classify_token,
    decode_with_leeway,
    get_signing_key_for_cognito_rs256,
    peek_claims_unverified,
    tokens_delete,
    tokens_get,
    tokens_upsert,
    verify_minimal_token,
)

# User management
from .user import (
    SecurityException,
    build_user_data_export,
    delete_user_and_all_related_data,
    find_or_create_user_by_cognito,
    get_current_user,
    require_auth,
)

# Utilities
from .utils import (
    clear_auth_cookies,
    create_auth_response,
    create_error_response,
    create_minimal_tokens,
    decode_cognito_token,
    generate_request_id,
    mask_email,
    set_auth_cookies,
    validate_required_fields,
)

__all__ = [
    # Core services
    "AWS_COGNITO_service",
    "CognitoService",
    "google_oauth_service",
    "GoogleOAuthService",
    "minimal_token_service",
    "MinimalTokenService",
    # Flow handlers
    "handle_signup",
    "handle_login",
    "handle_verification",
    "handle_resend_code",
    "handle_google_oauth_callback",
    "handle_refresh_token",
    "ensure_cognito_account_for_user",
    # User management
    "build_user_data_export",
    "delete_user_and_all_related_data",
    "find_or_create_user_by_cognito",
    "get_current_user",
    "require_auth",
    "SecurityException",
    # Token management
    "tokens_get",
    "tokens_upsert",
    "tokens_delete",
    "classify_token",
    "peek_claims_unverified",
    "verify_minimal_token",
    "get_signing_key_for_cognito_rs256",
    "decode_with_leeway",
    # Utilities
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
