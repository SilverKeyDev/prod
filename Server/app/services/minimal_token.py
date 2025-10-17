"""
Minimal Token Service
Generates lightweight custom JWT tokens with only essential claims to reduce storage size.
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import jwt
from flask import current_app  # if you need it for config; safe to keep

logger = logging.getLogger(__name__)

 
class MinimalTokenService:
    """Service for generating and verifying Minimal JWT access tokens."""

    # ---- Constants / Defaults -------------------------------------------------
    _ALG_ACCESS = "HS256"
    _ALG_ID = "RS256"

    # Clear, distinct routing markers so middleware can decide verification path.
    _ISSUER = "silverkey:minimal"
    _AUDIENCE = "usesilverkey-web"
    _VERSION = "min-1"

    # Clock skew handling - conservative leeway for verification
    _SKEW_SECONDS = 60  # 60 seconds leeway for verification

    # Env var names
    _ENV_HS_SECRET = "MINIMAL_TOKEN_HS_SECRET"  # use a dedicated secret for HS256
    _ENV_RS_PRIV = "AUTH_RS256_PRIVATE_KEY_PEM"
    _ENV_JWKS_KID = "AUTH_JWKS_KID"
    _ENV_ISSUER = "AUTH_ISSUER"     # optional override for ID token issuer
    _ENV_AUDIENCE = "AUTH_AUDIENCE" # optional override for ID token audience

    def __init__(self):
        # Lazy-loaded fields
        self._hs_secret: str | None = None
        self._rsa_private_key: str | None = None
        self._kid: str | None = None
        self._id_issuer: str | None = None
        self._id_audience: str | None = None

    # ---- Internal loaders -----------------------------------------------------

    def _get_hs_secret(self) -> str:
        """Lazy-load HS256 secret key from a **dedicated** environment variable."""
        if self._hs_secret is None:
            secret = os.getenv(self._ENV_HS_SECRET)
            if not secret:
                # Fallback to AWS_SECRET_ACCESS_KEY for backward compatibility
                secret = os.getenv('AWS_SECRET_ACCESS_KEY')
                if secret:
                    logger.info("MINIMAL_TOKEN_USING_AWS_SECRET_ACCESS_KEY_FALLBACK")
                else:
                    # Development fallback with loud warning
                    secret = "silverkey-minimal-token-secret-key-DEV-DO-NOT-USE-IN-PROD"
                    logger.warning(
                        "MINIMAL_TOKEN_USING_DEV_SECRET: %s and AWS_SECRET_ACCESS_KEY not set; using development fallback",
                        self._ENV_HS_SECRET,
                    )
            # Do not log or preview secret material
            self._hs_secret = secret
            logger.info("MINIMAL_TOKEN_SECRET_KEY_LOADED")
        return self._hs_secret

    def _get_rs256_config(self):
        """Lazy-load RS256 config for ID tokens (if you choose to mint them)."""
        if self._rsa_private_key is None:
            self._rsa_private_key = os.getenv(self._ENV_RS_PRIV) or ""
            self._kid = os.getenv(self._ENV_JWKS_KID, "dev-key-1")
            # Allow overrides; else use sane defaults distinct from Minimal tokens
            self._id_issuer = os.getenv(self._ENV_ISSUER, "silverkey-api")
            self._id_audience = os.getenv(self._ENV_AUDIENCE, "usesilverkey-web")

            logger.info(
                "MINIMAL_TOKEN_RS256_CONFIG_LOADED",
                extra={
                    "has_rsa_private_key": bool(self._rsa_private_key),
                    "kid": self._kid,
                    "issuer": self._id_issuer,
                    "audience": self._id_audience,
                },
            )
        return self._rsa_private_key, self._kid, self._id_issuer, self._id_audience

    # ---- Public helpers -------------------------------------------------------

    @staticmethod
    def _utcnow() -> datetime:
        return datetime.now(timezone.utc)

    @classmethod
    def token_markers(cls) -> Dict[str, str]:
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

            # Prefer explicit payload markers over header.alg; alg alone is not definitive.
            if (
                payload.get("iss") == self._ISSUER
                or payload.get("aud") == self._AUDIENCE
                or str(payload.get("ver", "")).startswith(self._VERSION)
            ):
                return True

            # As a final hint, Minimal tokens we mint use HS256 and include "type":"access".
            if header.get("alg") == self._ALG_ACCESS and payload.get("type") == "access":
                return True

            return False
        except Exception:
            return False

    # ---- Access token (HS256) ------------------------------------------------

    def create_minimal_access_token(
        self,
        user_id: str,
        user_email: str,
        expires_in_hours: int = 8,
        extra_claims: Dict[str, Any] | None = None,
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

        payload: Dict[str, Any] = {
            "iss": self._ISSUER,
            "aud": self._AUDIENCE,
            "ver": self._VERSION,
            "type": "access",
            "sub": user_id,
            "email": user_email,
            # Use current UTC epoch seconds for iat; omit nbf to avoid immature errors
            "iat": int(now.timestamp()),
            "exp": int(exp_time.timestamp()),
        }
        if extra_claims:
            # Do not allow callers to override core routing/timing claims
            for k in ("iss", "aud", "ver", "type", "iat", "exp"):
                if k in extra_claims:
                    raise ValueError(f"extra_claims may not include reserved claim '{k}'")
            payload.update(extra_claims)

        token = jwt.encode(payload, hs_secret, algorithm=self._ALG_ACCESS)

        logger.info(
            "MINIMAL_ACCESS_TOKEN_CREATED",
            extra={
                "user_id": user_id,
                "email_masked": f"{user_email[:3]}***{user_email[-3:]}" if user_email else "missing",
                "expires_at": exp_time.isoformat(),
                "algorithm": self._ALG_ACCESS,
                "issuer": self._ISSUER,
                "audience": self._AUDIENCE,
                "version": self._VERSION,
            },
        )
        return token

    def verify_minimal_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode a Minimal **access** token (HS256).
        Enforces issuer, audience, type, and timing with leeway.
        """
        hs_secret = self._get_hs_secret()

        try:
            # Log timing information for debugging ImmatureSignatureError
            current_time = int(self._utcnow().timestamp())
            
            # Decode without verification first to get timing claims
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            token_iat = unverified_payload.get('iat')
            token_nbf = unverified_payload.get('nbf', 0)
            token_exp = unverified_payload.get('exp', 0)
            
            # Calculate timing differences
            iat_age_seconds = (current_time - token_iat) if token_iat is not None else None
            nbf_age_seconds = current_time - token_nbf
            exp_remaining_seconds = token_exp - current_time
            
            logger.info("MINIMAL_TOKEN_TIMING_ANALYSIS", extra={
                'current_time': current_time,
                'token_iat': token_iat,
                'token_nbf': token_nbf,
                'token_exp': token_exp,
                'iat_age_seconds': iat_age_seconds,
                'nbf_age_seconds': nbf_age_seconds,
                'exp_remaining_seconds': exp_remaining_seconds,
                'leeway_seconds': self._SKEW_SECONDS,
                'is_immature': nbf_age_seconds < 0,
                'immaturity_seconds': abs(nbf_age_seconds) if nbf_age_seconds < 0 else 0
            })

            payload = jwt.decode(
                token,
                hs_secret,
                algorithms=[self._ALG_ACCESS],
                audience=self._AUDIENCE,
                issuer=self._ISSUER,
                leeway=self._SKEW_SECONDS,
                options={
                    # Only require exp; iat can be omitted from enforcement to avoid false immaturity
                    "require": ["exp", "iss", "aud", "sub"],
                },
            )

            # Strongly assert token type/version so Minimal never routes to Cognito
            if payload.get("type") != "access":
                raise jwt.InvalidTokenError("Minimal token has unexpected type")
            if not str(payload.get("ver", "")).startswith(self._VERSION):
                raise jwt.InvalidTokenError("Minimal token has unexpected version")

            logger.debug(
                "MINIMAL_TOKEN_VERIFIED_HS256",
                extra={
                    "user_id": payload.get("sub", "missing"),
                    "algorithm": self._ALG_ACCESS,
                    "issuer": payload.get("iss"),
                    "audience": payload.get("aud"),
                    "version": payload.get("ver"),
                },
            )
            return payload

        except jwt.ExpiredSignatureError:
            logger.warning("MINIMAL_TOKEN_EXPIRED", extra={
                'current_time': current_time,
                'token_exp': token_exp,
                'expired_by_seconds': current_time - token_exp
            })
            raise
        except jwt.ImmatureSignatureError as e:
            # Enhanced logging for ImmatureSignatureError debugging
            logger.warning("MINIMAL_TOKEN_IMMATURE", extra={
                'current_time': current_time,
                'token_iat': token_iat,
                'token_nbf': token_nbf,
                'token_exp': token_exp,
                'iat_age_seconds': iat_age_seconds,
                'nbf_age_seconds': nbf_age_seconds,
                'exp_remaining_seconds': exp_remaining_seconds,
                'leeway_seconds': self._SKEW_SECONDS,
                'immaturity_seconds': abs(nbf_age_seconds) if nbf_age_seconds < 0 else 0,
                'error_message': str(e),
                'backdating_applied': 60,  # Our backdating amount
                'recommendation': 'Increase backdating or leeway if this persists'
            })
            raise
        except jwt.InvalidTokenError as e:
            logger.warning("MINIMAL_TOKEN_INVALID", extra={
                'error': str(e),
                'current_time': current_time,
                'token_iat': token_iat,
                'token_nbf': token_nbf,
                'token_exp': token_exp
            })
            raise
        except Exception as e:
            logger.error("MINIMAL_TOKEN_VERIFICATION_ERROR", extra={
                'error': str(e), 
                'error_type': type(e).__name__,
                'current_time': current_time,
                'token_iat': token_iat,
                'token_nbf': token_nbf,
                'token_exp': token_exp
            })
            raise

    # ---- ID token (RS256-only, optional) -------------------------------------
    # In most cases you do NOT need to mint your own ID token if you already
    # have Google's (or Cognito's) ID token. Keep this disabled unless you have a
    # concrete requirement (e.g., 1P identity that other services must trust).

    def create_minimal_id_token(
        self,
        user_id: str,
        user_email: str,
        user_name: str,
        expires_in_hours: int = 8,
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
            # Refuse to mint HS256 ID tokens; they can be mistaken for Cognito/Google.
            logger.info("MINIMAL_ID_TOKEN_RS256_OPTIONAL_MISSING", extra={
                'missing_env_var': self._ENV_RS_PRIV,
                'note': 'RS256 private key not configured - ID token creation skipped (optional)'
            })
            raise RuntimeError(
                "RS256 private key not configured; refusing to mint HS256 ID token. "
                "Use the provider's ID token or configure AUTH_RS256_PRIVATE_KEY_PEM."
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
            # Backdate nbf to handle clock skew
            "iat": int((now - timedelta(seconds=self._SKEW_SECONDS)).timestamp()),
            "nbf": int((now - timedelta(seconds=self._SKEW_SECONDS)).timestamp()),
            "exp": int(exp_time.timestamp()),
            "type": "id",
            # Note: We intentionally do NOT use Minimal issuer/audience here to
            # avoid routing collisions with Minimal access tokens.
        }

        headers = {"kid": kid}
        token = jwt.encode(payload, rsa_private_key, algorithm=self._ALG_ID, headers=headers)

        logger.info(
            "MINIMAL_ID_TOKEN_CREATED_RS256",
            extra={
                "user_id": user_id,
                "email_masked": f"{user_email[:3]}***{user_email[-3:]}",
                "name_masked": (user_name[:8] + "***") if user_name else "missing",
                "expires_at": exp_time.isoformat(),
                "algorithm": self._ALG_ID,
                "issuer": issuer,
                "audience": audience,
                "kid": kid,
            },
        )
        return token

    # ---- Utilities ------------------------------------------------------------

    def get_token_size_info(self, token: str) -> Dict[str, int]:
        """
        Return simple size metrics for a JWT. Signature is not verified.
        """
        try:
            # Decode without verification to estimate payload size
            payload = jwt.decode(token, options={"verify_signature": False})
            token_bytes = len(token.encode("utf-8"))
            payload_bytes = len(str(payload).encode("utf-8"))
            return {
                "total_size_bytes": token_bytes,
                "payload_size_bytes": payload_bytes,
                "header_size_bytes": token_bytes - payload_bytes,
                "compression_ratio": round((payload_bytes / token_bytes) * 100, 2) if token_bytes else 0,
            }
        except Exception as e:
            logger.error("TOKEN_SIZE_CALCULATION_ERROR", extra={"error": str(e)})
            return {
                "total_size_bytes": len(token.encode("utf-8")),
                "payload_size_bytes": 0,
                "header_size_bytes": 0,
                "compression_ratio": 0,
            }

# Singleton instance
minimal_token_service = MinimalTokenService()
