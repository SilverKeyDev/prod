"""
DocuSign OAuth flow: state, auth URL, and code-for-tokens exchange.
"""

import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from docusign_esign import ApiClient
from docusign_esign.client.api_exception import ApiException
from sqlalchemy import select

from app import db
from app.config import Config
from app.models import DocusignOAuthToken
from logger import log

from ..errors import DocusignAuthError
from .types import parse_oauth_token_response, parse_user_info


def _validate_oauth_config():
    """Validate required OAuth configuration."""
    missing_vars = []
    if not Config.DOCUSIGN_CLIENT_ID:
        missing_vars.append("DOCUSIGN_CLIENT_ID")
    if not Config.DOCUSIGN_CLIENT_SECRET:
        missing_vars.append("DOCUSIGN_CLIENT_SECRET")
    if not Config.DOCUSIGN_OAUTH_REDIRECT_URI:
        missing_vars.append("DOCUSIGN_OAUTH_REDIRECT_URI")
    if not Config.DOCUSIGN_BASE_URL:
        missing_vars.append("DOCUSIGN_BASE_URL")
    if missing_vars:
        error_msg = (
            f"DocuSign OAuth service missing required configuration: {', '.join(missing_vars)}"
        )
        log.error("ERRORS", error_msg)
        raise DocusignAuthError(error_msg)


def _encode_state(user_id: str, token: str) -> str:
    """Securely encode user_id and token into state parameter (HMAC)."""
    payload = f"{user_id}:{token}"
    raw = Config.SECRET_KEY
    secret = raw.encode() if isinstance(raw, str) else raw
    if secret is None:
        raise DocusignAuthError("SECRET_KEY not set")
    signature = hmac.new(secret, payload.encode(), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{payload}:{signature_b64}"


def _decode_state(state: str) -> str:
    """Decode and verify state parameter; return user_id."""
    try:
        parts = state.rsplit(":", 1)
        if len(parts) != 2:
            raise DocusignAuthError("Invalid state format")
        payload, signature_b64 = parts
        raw = Config.SECRET_KEY
        secret = raw.encode() if isinstance(raw, str) else raw
        if secret is None:
            raise DocusignAuthError("SECRET_KEY not set")
        expected_signature = hmac.new(secret, payload.encode(), hashlib.sha256).digest()
        padding = (4 - len(signature_b64) % 4) % 4
        signature_b64_padded = signature_b64 + "=" * padding
        provided_signature = base64.urlsafe_b64decode(signature_b64_padded)
        if not hmac.compare_digest(expected_signature, provided_signature):
            raise DocusignAuthError("State signature verification failed")
        user_id, _ = payload.split(":", 1)
        return user_id
    except (ValueError, IndexError) as e:
        log.error("ERRORS", "Failed to decode state", {"error": str(e)})
        raise DocusignAuthError("Invalid state token") from e


def build_auth_url(user_id: str) -> tuple[str, str]:
    """Build OAuth authorization URL for user. Returns (auth_url, state)."""
    log.debug("DOCUSIGN", "Building DocuSign OAuth URL", {"user_id": user_id})
    _validate_oauth_config()
    token = secrets.token_urlsafe(32)
    state_data = _encode_state(user_id, token)
    scopes = "signature impersonation"
    oauth_host = (
        Config.DOCUSIGN_BASE_URL.replace("https://", "")
        .replace("http://", "")
        .replace("/restapi", "")
    )
    auth_url = (
        f"https://{oauth_host}/oauth/auth"
        f"?response_type=code"
        f"&scope={scopes}"
        f"&client_id={Config.DOCUSIGN_CLIENT_ID}"
        f"&redirect_uri={Config.DOCUSIGN_OAUTH_REDIRECT_URI}"
        f"&state={state_data}"
    )
    log.info(
        "DOCUSIGN",
        "DocuSign OAuth URL built successfully",
        {"user_id": user_id, "oauth_host": oauth_host, "state_prefix": state_data[:8] + "..."},
    )
    return auth_url, state_data


def extract_user_id_from_state(state: str) -> str:
    """Extract user ID from state token (verifies HMAC)."""
    return _decode_state(state)


def exchange_code_for_tokens(user_id: str, code: str) -> DocusignOAuthToken:
    """Exchange authorization code for access and refresh tokens."""
    _validate_oauth_config()
    try:
        log.debug(
            "DOCUSIGN",
            "Exchanging OAuth code for tokens",
            {"user_id": user_id, "code_length": len(code) if code else 0},
        )
        api_client = ApiClient()
        oauth_host = (
            Config.DOCUSIGN_BASE_URL.replace("https://", "")
            .replace("http://", "")
            .replace("/restapi", "")
        )
        api_client.set_oauth_host_name(oauth_host)
        raw_oauth_response = api_client.generate_access_token(
            client_id=Config.DOCUSIGN_CLIENT_ID,
            client_secret=Config.DOCUSIGN_CLIENT_SECRET,
            code=code,
        )
        oauth_response = parse_oauth_token_response(raw_oauth_response)
        log.debug(
            "DOCUSIGN",
            "OAuth tokens received, fetching user info",
            {"user_id": user_id, "expires_in": oauth_response.expires_in},
        )
        raw_user_info = api_client.get_user_info(oauth_response.access_token)
        user_info = parse_user_info(raw_user_info)
        if not user_info.accounts:
            log.warn(
                "DOCUSIGN",
                "No DocuSign accounts found for user",
                {"user_id": user_id},
            )
            raise DocusignAuthError("No DocuSign accounts found")
        account = user_info.accounts[0]
        log.debug(
            "DOCUSIGN",
            "Saving OAuth tokens",
            {
                "user_id": user_id,
                "account_id": account.account_id,
                "accounts_count": len(user_info.accounts),
            },
        )
        token = db.session.scalar(
            select(DocusignOAuthToken).where(DocusignOAuthToken.user_id == user_id)
        )
        is_new_token = not token
        if not token:
            token = DocusignOAuthToken(user_id=user_id)
        token.access_token = oauth_response.access_token
        token.refresh_token = oauth_response.refresh_token
        token.token_expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=oauth_response.expires_in
        )
        token.account_id = account.account_id
        token.base_uri = account.base_uri
        token.scopes = json.dumps(oauth_response.scope.split())
        db.session.add(token)
        db.session.commit()
        log.info(
            "DOCUSIGN",
            "OAuth tokens saved successfully",
            {
                "user_id": user_id,
                "account_id": account.account_id,
                "is_new_token": is_new_token,
                "expires_at": token.token_expires_at.isoformat(),
            },
        )
        return token
    except ApiException as e:
        log.error(
            "ERRORS",
            "OAuth token exchange failed",
            {"error": str(e), "user_id": user_id, "status": getattr(e, "status", None)},
        )
        raise DocusignAuthError(f"OAuth token exchange failed: {str(e)}") from e
    except Exception as e:
        log.error(
            "ERRORS",
            "Unexpected OAuth error",
            {"error": str(e), "user_id": user_id},
        )
        db.session.rollback()
        raise DocusignAuthError(f"OAuth failed: {str(e)}") from e
