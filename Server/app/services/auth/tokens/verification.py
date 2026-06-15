"""
Token verification and classification utilities.
"""

import os
import time
from typing import Any

import requests
from jose import jwk
from jose import jwt as jose_jwt
from jose.exceptions import JWTError

from app.config.aws import AWS_COGNITO_CLIENT_ID as _CONFIG_COGNITO_CLIENT_ID
from app.config.aws import AWS_COGNITO_USER_POOL_ID as _CONFIG_COGNITO_POOL_ID
from app.config.aws import AWS_REGION
from app.utils.security.security import log_security_event
from app.utils.testing_mode import is_testing
from logger import log

from ..core.minimal_token_service import minimal_token_service

_TEST_COGNITO_POOL_ID = "us-east-2_pytestStubPoolId"
_TEST_COGNITO_CLIENT_ID = "pytest-stub-cognito-client-id"


def _resolve_cognito_pool_id() -> str:
    if _CONFIG_COGNITO_POOL_ID:
        return _CONFIG_COGNITO_POOL_ID
    if is_testing():
        return _TEST_COGNITO_POOL_ID
    return ""


def _resolve_cognito_client_id() -> str:
    if _CONFIG_COGNITO_CLIENT_ID:
        return _CONFIG_COGNITO_CLIENT_ID
    if is_testing():
        return _TEST_COGNITO_CLIENT_ID
    return ""


AWS_COGNITO_POOL_ID = _resolve_cognito_pool_id()
AWS_COGNITO_CLIENT_ID = _resolve_cognito_client_id()
_pool_region = (
    AWS_COGNITO_POOL_ID.split("_", 1)[0] if AWS_COGNITO_POOL_ID else AWS_REGION or "us-east-2"
)
AWS_COGNITO_REGION = os.getenv("AWS_COGNITO_REGION") or AWS_REGION or _pool_region
AWS_COGNITO_ISSUER = f"https://cognito-idp.{AWS_COGNITO_REGION}.amazonaws.com/{AWS_COGNITO_POOL_ID}"
AWS_COGNITO_KEYS_URL = f"{AWS_COGNITO_ISSUER}/.well-known/jwks.json"
_JWKS = None
_JWKS_TS = 0.0
_JWKS_TTL = 60 * 60


def _load_jwks(force: bool = False):
    """Load JWKS with a simple TTL cache to handle key rotations gracefully."""
    global _JWKS, _JWKS_TS
    now = time.time()
    if force or _JWKS is None or now - _JWKS_TS > _JWKS_TTL:
        try:
            resp = requests.get(AWS_COGNITO_KEYS_URL, timeout=3)
            resp.raise_for_status()
            _JWKS = resp.json()
            _JWKS_TS = now
        except Exception as e:
            log.warn("AUTH", f"JWKS fetch failed (will retry on demand): {e}")
            if _JWKS is None:
                _JWKS = {"keys": []}
    return _JWKS


def _find_key(jwks: dict, kid: str):
    for k in (jwks or {}).get("keys", []):
        if k.get("kid") == kid:
            return k
    return None


def get_signing_key_for_cognito_rs256(token: str):
    """
    Resolve signing key for a Cognito token.
    IMPORTANT: Only call this for tokens you already determined are Cognito (i.e., NOT your minimal HS256 tokens).
    """
    try:
        headers = jose_jwt.get_unverified_header(token)
        alg = headers.get("alg")
        if alg != "RS256":
            log_security_event("auth_invalid_alg", {"alg": alg})
            raise JWTError("Invalid JWT alg for Cognito (expected RS256)")
        key_id = headers.get("kid")
        if not key_id:
            raise JWTError("Missing kid in token header")
        jwks = _load_jwks()
        key = _find_key(jwks, key_id)
        if not key:
            jwks = _load_jwks(force=True)
            key = _find_key(jwks, key_id)
        if not key:
            raise JWTError("Public key not found in JWKS")
        return jwk.construct(key)
    except Exception as e:
        log.error("ERRORS", f"Error getting signing key: {e}", e)
        raise JWTError("Invalid token header") from e


def decode_with_leeway(
    token: str,
    key,
    issuer: str,
    leeway_seconds: int,
    verify_aud: bool = False,
    audience: str | None = None,
):
    """
    Try python-jose decode with leeway as kwarg; if TypeError, retry with options['leeway'].
    We default verify_aud to False so we can read token_use first, then enforce audience/client checks manually.
    """
    base_opts = {"verify_aud": verify_aud, "verify_iss": True, "verify_signature": True}
    try:
        return jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            issuer=issuer,
            options=base_opts,
            audience=audience,
            leeway=leeway_seconds,
        )
    except TypeError:
        opts: dict[str, Any] = dict(base_opts)
        opts["leeway"] = leeway_seconds
        return jose_jwt.decode(
            token, key=key, algorithms=["RS256"], issuer=issuer, options=opts, audience=audience
        )


def classify_token(token: str) -> str:
    """
    Classify token type to prevent HS256 → Cognito routing.
    Returns: 'minimal', 'cognito', 'reject_cognito_alg', or 'unknown'
    """
    try:
        header = jose_jwt.get_unverified_header(token)
        alg = header.get("alg")
        try:
            claims = jose_jwt.get_unverified_claims(token)
            iss = claims.get("iss")
            typ = claims.get("type")
        except Exception:
            iss, typ = (None, None)
        if iss and "cognito-idp." in iss:
            return "cognito" if alg == "RS256" else "reject_cognito_alg"
        if typ == "access" and iss == "silverkey:minimal" or alg == "HS256":
            return "minimal"
        return "unknown"
    except Exception:
        return "unknown"


def peek_claims_unverified(token: str) -> dict:
    """
    Safely read claims without verifying signature to decide routing (minimal vs Cognito).
    Uses jose_jwt.get_unverified_claims which does not require a key.
    """
    try:
        claims = jose_jwt.get_unverified_claims(token)
        return dict(claims)
    except Exception as e:
        log.debug("AUTH", f"Unverified claims peek failed: {e}")
        return {}


def verify_minimal_token(token: str):
    """
    Verify a minimal token and return the claims.
    """
    return minimal_token_service.verify_minimal_token(token)
