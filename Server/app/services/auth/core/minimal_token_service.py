"""
Minimal Token Service
Generates lightweight custom JWT tokens with only essential claims to reduce storage size.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from logger import log


class MinimalTokenService:
    """Service for generating and verifying Minimal JWT access tokens."""

    _ALG_ACCESS = "HS256"
    _ALG_ID = "RS256"
    _ISSUER = "silverkey:minimal"
    _AUDIENCE = "usesilverkey-web"
    _VERSION = "min-1"
    _SKEW_SECONDS = 60
    _ENV_HS_SECRET = "JWT_SIGNING_SECRET"
    _ENV_RS_PRIV = "AUTH_RS256_PRIVATE_KEY_PEM"
    _ENV_JWKS_KID = "AUTH_JWKS_KID"
    _ENV_ISSUER = "AUTH_ISSUER"
    _ENV_AUDIENCE = "AUTH_AUDIENCE"

    def __init__(self):
        self._hs_secret: str | None = None
        self._rsa_private_key: str | None = None
        self._kid: str | None = None
        self._id_issuer: str | None = None
        self._id_audience: str | None = None

    def _get_hs_secret(self) -> str:
        """Lazy-load HS256 secret from JWT_SIGNING_SECRET (not AWS credentials)."""
        if self._hs_secret is None:
            raw = os.getenv(self._ENV_HS_SECRET)
            secret = raw.strip() if raw else ""
            if not secret:
                raise RuntimeError(
                    f"Minimal token HS256 secret required: set {self._ENV_HS_SECRET} (a long random value used only for signing these JWTs; rotate independently of AWS keys). Do not use a hardcoded secret in production."
                )
            self._hs_secret = secret
        return self._hs_secret

    def _get_rs256_config(self):
        """Lazy-load RS256 config for ID tokens (if you choose to mint them)."""
        if self._rsa_private_key is None:
            self._rsa_private_key = os.getenv(self._ENV_RS_PRIV) or ""
            self._kid = os.getenv(self._ENV_JWKS_KID, "dev-key-1")
            self._id_issuer = os.getenv(self._ENV_ISSUER, "silverkey-api")
            self._id_audience = os.getenv(self._ENV_AUDIENCE, "usesilverkey-web")
        return (self._rsa_private_key, self._kid, self._id_issuer, self._id_audience)

    @staticmethod
    def _utcnow() -> datetime:
        return datetime.now(timezone.utc)

    @classmethod
    def token_markers(cls) -> dict[str, str]:
        """Expose core routing markers so other modules can import without instantiating."""
        return {"iss": cls._ISSUER, "aud": cls._AUDIENCE, "ver": cls._VERSION}

    def is_minimal_token(self, token: str) -> bool:
        """
        Lightweight check (no signature verification) to decide if a token
        is a Minimal token. Use this to short-circuit your middleware so HS256
        Minimal tokens never hit Cognito verification.
        """
        try:
            header = jwt.get_unverified_header(token)
            payload = jwt.decode(token, options={"verify_signature": False})
            if (
                payload.get("iss") == self._ISSUER
                or payload.get("aud") == self._AUDIENCE
                or str(payload.get("ver", "")).startswith(self._VERSION)
            ):
                return True
            if header.get("alg") == self._ALG_ACCESS and payload.get("type") == "access":
                return True
            return False
        except Exception:
            return False

    def create_minimal_access_token(
        self,
        user_id: str,
        user_email: str,
        expires_in_hours: int = 8,
        extra_claims: dict[str, Any] | None = None,
    ) -> str:
        """
        Create a Minimal **access** token (HS256) with skew-resistant timing and routing markers.
        """
        if not user_id:
            raise ValueError("user_id cannot be empty")
        if not user_email:
            raise ValueError("user_email cannot be empty")
        hs_secret = self._get_hs_secret()
        now = self._utcnow()
        exp_time = now + timedelta(hours=expires_in_hours)
        payload: dict[str, Any] = {
            "iss": self._ISSUER,
            "aud": self._AUDIENCE,
            "ver": self._VERSION,
            "type": "access",
            "sub": user_id,
            "email": user_email,
            "iat": int(now.timestamp()),
            "exp": int(exp_time.timestamp()),
        }
        if extra_claims:
            for k in ("iss", "aud", "ver", "type", "iat", "exp"):
                if k in extra_claims:
                    raise ValueError(f"extra_claims may not include reserved claim '{k}'")
            payload.update(extra_claims)
        token = jwt.encode(payload, hs_secret, algorithm=self._ALG_ACCESS)
        return token

    def verify_minimal_token(self, token: str) -> dict[str, Any]:
        """
        Verify and decode a Minimal **access** token (HS256).
        Enforces issuer, audience, type, and timing with leeway.
        """
        hs_secret = self._get_hs_secret()
        current_time = int(self._utcnow().timestamp())
        token_iat: int | None = None
        token_nbf: int = 0
        token_exp: int = 0
        iat_age_seconds: int | None = None
        nbf_age_seconds: int = 0
        exp_remaining_seconds: int = 0
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            token_iat = unverified_payload.get("iat")
            token_nbf = unverified_payload.get("nbf", 0) or 0
            token_exp = unverified_payload.get("exp", 0) or 0
            iat_age_seconds = current_time - token_iat if token_iat is not None else None
            nbf_age_seconds = current_time - token_nbf
            exp_remaining_seconds = token_exp - current_time
            payload = jwt.decode(
                token,
                hs_secret,
                algorithms=[self._ALG_ACCESS],
                audience=self._AUDIENCE,
                issuer=self._ISSUER,
                leeway=self._SKEW_SECONDS,
                options={"require": ["exp", "iss", "aud", "sub"]},
            )
            if payload.get("type") != "access":
                raise jwt.InvalidTokenError("Minimal token has unexpected type")
            if not str(payload.get("ver", "")).startswith(self._VERSION):
                raise jwt.InvalidTokenError("Minimal token has unexpected version")
            return payload
        except jwt.ExpiredSignatureError:
            log.warn(
                "AUTH",
                "MINIMAL_TOKEN_EXPIRED",
                {
                    "current_time": current_time,
                    "token_exp": token_exp,
                    "expired_by_seconds": current_time - token_exp,
                },
            )
            raise
        except jwt.ImmatureSignatureError as e:
            log.warn(
                "AUTH",
                "MINIMAL_TOKEN_IMMATURE",
                {
                    "current_time": current_time,
                    "token_iat": token_iat,
                    "token_nbf": token_nbf,
                    "token_exp": token_exp,
                    "iat_age_seconds": iat_age_seconds,
                    "nbf_age_seconds": nbf_age_seconds,
                    "exp_remaining_seconds": exp_remaining_seconds,
                    "leeway_seconds": self._SKEW_SECONDS,
                    "immaturity_seconds": abs(nbf_age_seconds) if nbf_age_seconds < 0 else 0,
                    "error_message": str(e),
                    "backdating_applied": 60,
                    "recommendation": "Increase backdating or leeway if this persists",
                },
            )
            raise
        except jwt.InvalidTokenError as e:
            log.warn(
                "AUTH",
                "MINIMAL_TOKEN_INVALID",
                {
                    "error": str(e),
                    "current_time": current_time,
                    "token_iat": token_iat,
                    "token_nbf": token_nbf,
                    "token_exp": token_exp,
                },
            )
            raise
        except Exception as e:
            log.error(
                "ERRORS",
                "MINIMAL_TOKEN_VERIFICATION_ERROR",
                {
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "current_time": current_time,
                    "token_iat": token_iat,
                    "token_nbf": token_nbf,
                    "token_exp": token_exp,
                },
            )
            raise

    def create_minimal_id_token(
        self, user_id: str, user_email: str, user_name: str, expires_in_hours: int = 8
    ) -> str:
        """
        Create a Minimal **ID** token (RS256). No HS256 fallback by design.
        If RS256 key is not configured, this will raise to avoid confusing HS256 ID tokens.
        """
        if not user_id:
            raise ValueError("user_id cannot be empty")
        if not user_email:
            raise ValueError("user_email cannot be empty")
        if not user_name or not user_name.strip():
            raise ValueError("user_name cannot be empty")
        rsa_private_key, kid, issuer, audience = self._get_rs256_config()
        if not rsa_private_key.strip():
            raise RuntimeError(
                "RS256 private key not configured; refusing to mint HS256 ID token. Use the provider's ID token or configure AUTH_RS256_PRIVATE_KEY_PEM."
            )
        now = self._utcnow()
        exp_time = now + timedelta(hours=expires_in_hours)
        payload = {
            "iss": issuer,
            "aud": audience,
            "sub": user_id,
            "email": user_email,
            "email_verified": True,
            "name": user_name,
            "iat": int((now - timedelta(seconds=self._SKEW_SECONDS)).timestamp()),
            "nbf": int((now - timedelta(seconds=self._SKEW_SECONDS)).timestamp()),
            "exp": int(exp_time.timestamp()),
            "type": "id",
        }
        headers = {"kid": kid}
        token = jwt.encode(payload, rsa_private_key, algorithm=self._ALG_ID, headers=headers)
        return token

    def get_token_size_info(self, token: str) -> dict[str, int]:
        """
        Return simple size metrics for a JWT. Signature is not verified.
        """
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            token_bytes = len(token.encode("utf-8"))
            payload_bytes = len(str(payload).encode("utf-8"))
            return {
                "total_size_bytes": token_bytes,
                "payload_size_bytes": payload_bytes,
                "header_size_bytes": token_bytes - payload_bytes,
                "compression_ratio": int(round(payload_bytes / token_bytes * 100, 2))
                if token_bytes
                else 0,
            }
        except Exception as e:
            log.error("ERRORS", "TOKEN_SIZE_CALCULATION_ERROR", {"error": str(e)})
            return {
                "total_size_bytes": len(token.encode("utf-8")),
                "payload_size_bytes": 0,
                "header_size_bytes": 0,
                "compression_ratio": 0,
            }


minimal_token_service = MinimalTokenService()
