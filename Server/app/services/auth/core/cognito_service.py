"""
AWS Cognito Service
Thin facade delegating to cognito_crypto, cognito_auth_flows, cognito_admin.
"""

import os

import boto3

from .cognito_admin import (
    admin_create_user as _admin_create_user,
)
from .cognito_admin import (
    admin_delete_user as _admin_delete_user,
)
from .cognito_admin import (
    admin_get_user as _admin_get_user,
)
from .cognito_admin import (
    admin_get_user_status as _admin_get_user_status,
)
from .cognito_admin import (
    admin_reset_user_password as _admin_reset_user_password,
)
from .cognito_admin import (
    admin_set_user_password as _admin_set_user_password,
)
from .cognito_auth_flows import (
    confirm_forgot_password as _confirm_forgot_password,
)
from .cognito_auth_flows import (
    confirm_sign_up as _confirm_sign_up,
)
from .cognito_auth_flows import (
    forgot_password as _forgot_password,
)
from .cognito_auth_flows import (
    refresh_access_token as _refresh_access_token,
)
from .cognito_auth_flows import (
    sign_in as _sign_in,
)
from .cognito_auth_flows import (
    sign_up as _sign_up,
)
from .cognito_crypto import get_secret_hash as _get_secret_hash_impl


def _get_username_from_request():
    """Extract username from current access token (Flask request) for refresh token fallback."""
    try:
        import jwt
        from flask import request

        access_token = request.cookies.get("session")
        if not access_token:
            return None
        decoded = jwt.decode(access_token, options={"verify_signature": False})
        return decoded.get("email") or decoded.get("sub")
    except Exception:
        return None


class CognitoService:
    def __init__(self):
        from app.config import Config

        self.region = Config.AWS_REGION
        self.client = boto3.client(
            "cognito-idp",
            region_name=self.region,
            config=boto3.session.Config(  # type: ignore[attr-defined]; boto3.session not fully typed
                read_timeout=Config.AWS_COGNITO_TIMEOUT,
                connect_timeout=Config.AWS_COGNITO_TIMEOUT,
                retries={"max_attempts": 3},
            ),
        )
        self.user_pool_id = os.getenv("AWS_COGNITO_USER_POOL_ID") or ""
        self.client_id = os.getenv("AWS_COGNITO_CLIENT_ID") or ""
        self.client_secret = os.getenv("AWS_COGNITO_CLIENT_SECRET") or ""
        self._get_secret_hash = lambda username: _get_secret_hash_impl(
            self.client_id, self.client_secret, username
        )

    def sign_up(self, username, password, user_attributes):
        return _sign_up(
            self.client, self.client_id, self._get_secret_hash, username, password, user_attributes
        )

    def confirm_sign_up(self, username, confirmation_code):
        return _confirm_sign_up(
            self.client, self.client_id, self._get_secret_hash, username, confirmation_code
        )

    def sign_in(self, username, password):
        return _sign_in(self.client, self.client_id, self._get_secret_hash, username, password)

    def forgot_password(self, username, request_id=None, user_status=None):
        return _forgot_password(
            self.client, self.client_id, self._get_secret_hash, username, request_id, user_status
        )

    def confirm_forgot_password(self, username, confirmation_code, new_password):
        return _confirm_forgot_password(
            self.client,
            self.client_id,
            self._get_secret_hash,
            username,
            confirmation_code,
            new_password,
        )

    def refresh_access_token(self, refresh_token: str, username: str | None = None):
        return _refresh_access_token(
            self.client,
            self.client_id,
            self._get_secret_hash,
            refresh_token,
            username,
            get_username_fallback=_get_username_from_request,
        )

    def admin_create_user(self, username, user_attributes, temporary_password=None):
        return _admin_create_user(
            self.client,
            self.user_pool_id,
            username,
            user_attributes,
            temporary_password,
            admin_get_user_fn=lambda u: _admin_get_user(self.client, self.user_pool_id, u),
        )

    def admin_delete_user(self, username):
        return _admin_delete_user(self.client, self.user_pool_id, username)

    def admin_get_user(self, username):
        return _admin_get_user(self.client, self.user_pool_id, username)

    def admin_get_user_status(self, username):
        return _admin_get_user_status(self.client, self.user_pool_id, username)

    def admin_set_user_password(self, username, password, permanent=True):
        return _admin_set_user_password(
            self.client, self.user_pool_id, username, password, permanent
        )

    def admin_reset_user_password(self, username):
        return _admin_reset_user_password(self.client, self.user_pool_id, username)


AWS_COGNITO_service = CognitoService()
