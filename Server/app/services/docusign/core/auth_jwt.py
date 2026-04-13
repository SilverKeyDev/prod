"""
DocuSign JWT authentication

Implements JWT-based authentication for service account operations.
"""

import json
import re
import time
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from urllib.parse import quote, urlparse

import jwt as pyjwt
from docusign_esign import ApiClient
from docusign_esign.client.api_client import OAuth
from docusign_esign.client.api_exception import ApiException

from app.config import Config
from logger import LOG_CATEGORIES, get_logger

from ..errors import DocusignAuthError
from .api_client_rest import configure_rest_api_root
from .types import parse_jwt_token_response, parse_user_info

logger = get_logger()

_PRIVATE_PEM_MARKERS = (
    "-----BEGIN RSA PRIVATE KEY-----",
    "-----BEGIN PRIVATE KEY-----",
    "-----BEGIN ENCRYPTED PRIVATE KEY-----",
)

_PEM_HEADER_FOOTER_REPAIRS = (
    ("-----BEGIN\nRSA\nPRIVATE\nKEY-----", "-----BEGIN RSA PRIVATE KEY-----"),
    ("-----END\nRSA\nPRIVATE\nKEY-----", "-----END RSA PRIVATE KEY-----"),
    ("-----BEGIN\nPRIVATE\nKEY-----", "-----BEGIN PRIVATE KEY-----"),
    ("-----END\nPRIVATE\nKEY-----", "-----END PRIVATE KEY-----"),
    (
        "-----BEGIN\nENCRYPTED\nPRIVATE\nKEY-----",
        "-----BEGIN ENCRYPTED PRIVATE KEY-----",
    ),
    (
        "-----END\nENCRYPTED\nPRIVATE\nKEY-----",
        "-----END ENCRYPTED PRIVATE KEY-----",
    ),
)


def _repair_pem_headers_broken_by_whitespace(text: str) -> str:
    """Undo ``str.replace(' ', '\\n')`` on PEM wrappers (BEGIN/END split across lines)."""
    for broken, fixed in _PEM_HEADER_FOOTER_REPAIRS:
        text = text.replace(broken, fixed)
    return text


def _canonicalize_pem_block(text: str) -> str:
    """
    Normalize one PEM block: strip all whitespace from the base64 body and re-wrap at 64 cols.

    Handles .env / secrets that store the whole key on one line with spaces instead of newlines.
    """
    m = re.search(
        r"-----BEGIN (?P<label>[^-]+)-----\s*(?P<body>.*?)\s*-----END (?P=label)-----",
        text,
        re.DOTALL,
    )
    if not m:
        return text
    label = m.group("label").strip()
    body = m.group("body")
    body_clean = re.sub(r"\s+", "", body)
    if not body_clean:
        return text
    wrapped = "\n".join(body_clean[i : i + 64] for i in range(0, len(body_clean), 64))
    return f"-----BEGIN {label}-----\n{wrapped}\n-----END {label}-----"


def _normalize_private_key_pem(raw: str | bytes) -> bytes:
    """
    Turn env-sourced PEM into bytes OpenSSL can load.

    - Literal \\n sequences (common in .env / JSON secrets) become real newlines.
    - Headers broken by replacing every space with newline are repaired.
    - Single-line keys with spaces (instead of newlines) are canonicalized to standard PEM.
    - Collapsed header like ``-----BEGIN ...----- MIIE...`` gets a newline after the header.
    - Rejects obvious public-key PEM mistakes with a clear error.
    """
    if isinstance(raw, bytes):
        text = raw.decode("utf-8")
    else:
        text = raw
    text = text.replace("\\n", "\n").strip()
    if not text:
        raise DocusignAuthError("Private key value is empty")

    text = _repair_pem_headers_broken_by_whitespace(text)
    canonical = _canonicalize_pem_block(text)
    if canonical != text:
        text = canonical
    else:
        text = re.sub(r"(-----BEGIN [^-]+-----)\s+", r"\1\n", text, count=1)

    has_private = any(marker in text for marker in _PRIVATE_PEM_MARKERS)
    if not has_private:
        if "-----BEGIN PUBLIC KEY-----" in text or "-----BEGIN RSA PUBLIC KEY-----" in text:
            raise DocusignAuthError(
                "DocuSign JWT requires the RSA private key PEM "
                "(-----BEGIN RSA PRIVATE KEY----- or -----BEGIN PRIVATE KEY-----). "
                "The value looks like a public key; use the private key from DocuSign Apps and Keys."
            )
        raise DocusignAuthError(
            "Private key PEM is missing a recognized private-key header "
            "(-----BEGIN RSA PRIVATE KEY----- or -----BEGIN PRIVATE KEY-----)."
        )

    return text.encode("utf-8")


class DocusignJWTAuth:
    """
    JWT-based authentication for DocuSign.

    Uses service account credentials (integration key + private key) to obtain
    access tokens for system-level operations.
    """

    def __init__(self):
        self.integration_key = Config.DOCUSIGN_INTEGRATION_KEY
        self.impersonated_user_id = Config.DOCUSIGN_IMPERSONATED_USER_ID
        self.private_key = Config.DOCUSIGN_PRIVATE_KEY
        self.rsa_key_id = Config.DOCUSIGN_RSA_ID
        self.base_url = Config.DOCUSIGN_BASE_URL
        self.account_id = Config.DOCUSIGN_ACCOUNT_ID
        # JWT must use the OAuth host (account-d.docusign.com / account.docusign.com), not the REST API base
        # (e.g. demo.docusign.net). DOCUSIGN_OAUTH_TOKEN_URL is derived from FLASK_ENV + demo vs prod.
        token_url = Config.DOCUSIGN_OAUTH_TOKEN_URL
        self.oauth_host_name = urlparse(token_url).netloc

        # Token cache
        self._access_token: str | None = None
        self._token_expires_at: datetime | None = None

        # Validate configuration
        self._validate_config()

    def _validate_config(self):
        """Validate required JWT configuration"""
        missing_vars = []

        if not self.integration_key:
            missing_vars.append("DOCUSIGN_INTEGRATION_KEY")

        if not self.impersonated_user_id:
            missing_vars.append("DOCUSIGN_IMPERSONATED_USER_ID")

        if not self.private_key:
            missing_vars.append("DOCUSIGN_PRIVATE_KEY or DOCUSIGN_RSA_SECRET (PEM)")

        if not self.base_url:
            missing_vars.append("DOCUSIGN_BASE_URL")

        if not self.oauth_host_name:
            missing_vars.append("DOCUSIGN_OAUTH_TOKEN_URL (invalid or empty host)")

        if missing_vars:
            error_msg = (
                f"DocuSign JWT service missing required configuration: {', '.join(missing_vars)}"
            )
            logger.error(LOG_CATEGORIES["ERRORS"], error_msg)
            raise DocusignAuthError(error_msg)

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "DocuSign JWT configuration validated",
            {
                "has_integration_key": bool(self.integration_key),
                "has_impersonated_user_id": bool(self.impersonated_user_id),
                "has_private_key": bool(self.private_key),
                "has_rsa_key_id": bool(self.rsa_key_id),
                "base_url": self.base_url,
                "oauth_host_name": self.oauth_host_name,
            },
        )

        if not self.account_id:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "DOCUSIGN_ACCOUNT_ID not configured, will fetch from user info",
            )

    def _read_private_key(self) -> bytes:
        """Return private key PEM from env (DOCUSIGN_PRIVATE_KEY or DOCUSIGN_RSA_SECRET)."""
        try:
            if not self.private_key:
                raise DocusignAuthError("No private key configured")
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Using DocuSign private key from environment",
            )
            return _normalize_private_key_pem(self.private_key)
        except DocusignAuthError:
            raise
        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to read DocuSign private key",
                {"error": str(e)},
            )
            raise DocusignAuthError(f"Failed to read private key: {str(e)}") from e

    def _encode_jwt_assertion(self, private_key: bytes, expires_in: int, scopes: list[str]) -> str:
        """Build JWT assertion for DocuSign (matches SDK claims; adds ``kid`` when rsa_key_id is set)."""
        now = int(time.time())
        later = now + expires_in
        claim = {
            "iss": self.integration_key,
            "sub": self.impersonated_user_id,
            "aud": self.oauth_host_name,
            "iat": now,
            "exp": later,
            "scope": " ".join(scopes),
        }
        headers = {"kid": self.rsa_key_id} if self.rsa_key_id else None
        token = pyjwt.encode(claim, private_key, algorithm="RS256", headers=headers)
        return token if isinstance(token, str) else token.decode("utf-8")

    def _exchange_jwt_assertion(self, api_client: ApiClient, assertion: str) -> SimpleNamespace:
        """POST jwt-bearer assertion to OAuth token endpoint (same contract as SDK)."""
        response = api_client.request(
            "POST",
            f"https://{self.oauth_host_name}/oauth/token",
            headers=api_client.sanitize_for_serialization(
                {"Content-Type": "application/x-www-form-urlencoded"}
            ),
            post_params=api_client.sanitize_for_serialization(
                {"assertion": assertion, "grant_type": OAuth.GRANT_TYPE_JWT}
            ),
        )
        response_data = json.loads(response.data)
        if "token_type" not in response_data or "access_token" not in response_data:
            raise ApiException(http_resp=response)
        return SimpleNamespace(
            access_token=str(response_data["access_token"]),
            expires_in=int(response_data.get("expires_in", 3600)),
        )

    def _is_token_valid(self) -> bool:
        """Check if current token is valid"""
        if not self._access_token or not self._token_expires_at:
            return False

        # Check if token expires in the next 5 minutes
        buffer = timedelta(minutes=5)
        return datetime.now(timezone.utc) < (self._token_expires_at - buffer)

    def get_access_token(self, force_refresh: bool = False) -> str:
        """
        Get valid access token, refreshing if necessary.

        Args:
            force_refresh: Force token refresh even if current token is valid

        Returns:
            Access token

        Raises:
            DocusignAuthError: If authentication fails
        """
        if not force_refresh and self._is_token_valid():
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Using cached JWT token",
                {
                    "expires_at": self._token_expires_at.isoformat()
                    if self._token_expires_at
                    else None
                },
            )
            assert self._access_token is not None
            return self._access_token

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "JWT token refresh needed",
            {"force_refresh": force_refresh, "token_valid": self._is_token_valid()},
        )

        # Request new token
        return self._request_jwt_token()

    def _request_jwt_token(self) -> str:
        """Request new JWT access token from DocuSign"""
        try:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Requesting DocuSign JWT token",
                {
                    "impersonated_user_id": self.impersonated_user_id,
                    "oauth_host_name": self.oauth_host_name,
                    "rest_base_url": self.base_url,
                    "jwt_uses_rsa_key_id": bool(self.rsa_key_id),
                },
            )

            # Create API client (host must match REST root; SDK default host is prod www)
            api_client = ApiClient()
            configure_rest_api_root(api_client, self.base_url)

            # Read private key
            private_key = self._read_private_key()

            # Scopes for JWT: signature, impersonation
            scopes = ["signature", "impersonation"]
            expires_in = 3600

            # DocuSign SDK omits JWT ``kid``; multiple registered keys require DOCUSIGN_RSA_ID.
            if self.rsa_key_id:
                assertion = self._encode_jwt_assertion(private_key, expires_in, scopes)
                raw_response = self._exchange_jwt_assertion(api_client, assertion)
            else:
                raw_response = api_client.request_jwt_user_token(
                    client_id=self.integration_key,
                    user_id=self.impersonated_user_id,
                    oauth_host_name=self.oauth_host_name,
                    private_key_bytes=private_key,
                    expires_in=expires_in,
                    scopes=scopes,
                )
            oauth_response = parse_jwt_token_response(raw_response)

            # Cache token
            self._access_token = oauth_response.access_token
            self._token_expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=oauth_response.expires_in
            )

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "DocuSign JWT token obtained successfully",
                {
                    "expires_in": oauth_response.expires_in,
                    "expires_at": self._token_expires_at.isoformat(),
                },
            )

            token = self._access_token
            if not token:
                raise DocusignAuthError("No access token in DocuSign response")
            return token

        except ApiException as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "DocuSign JWT authentication failed",
                {
                    "error": str(e),
                    "status": getattr(e, "status", None),
                    "impersonated_user_id": self.impersonated_user_id,
                },
            )

            # Check for consent required error
            if hasattr(e, "body") and "consent_required" in str(e.body):
                consent_url = self._get_consent_url()
                logger.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "DocuSign consent required",
                    {"consent_url": consent_url},
                )
                raise DocusignAuthError(f"User consent required. Visit: {consent_url}") from e

            raise DocusignAuthError(f"JWT authentication failed: {str(e)}") from e

        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"], "Unexpected JWT authentication error", {"error": str(e)}
            )
            raise DocusignAuthError(f"JWT authentication failed: {str(e)}") from e

    def _get_consent_url(self) -> str:
        """Generate consent URL for JWT grant (OAuth account host, not REST API base)."""
        auth_base = Config.DOCUSIGN_OAUTH_AUTHORIZATION_URL
        sep = "&" if "?" in auth_base else "?"
        redirect_uri = quote(Config.DOCUSIGN_OAUTH_REDIRECT_URI, safe="")
        return (
            f"{auth_base}{sep}response_type=code&scope=signature%20impersonation"
            f"&client_id={self.integration_key}"
            f"&redirect_uri={redirect_uri}"
        )

    def get_api_client(self) -> ApiClient:
        """
        Get configured API client with valid access token.

        Returns:
            Configured ApiClient
        """
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"], "Creating DocuSign API client", {"base_url": self.base_url}
        )

        access_token = self.get_access_token()

        api_client = ApiClient()
        configure_rest_api_root(api_client, self.base_url)
        api_client.set_default_header("Authorization", f"Bearer {access_token}")

        logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign API client created successfully")

        return api_client

    def get_account_id(self) -> str:
        """
        Get DocuSign account ID.

        Returns:
            Account ID
        """
        if self.account_id:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Using cached account ID",
                {"account_id": self.account_id},
            )
            return self.account_id

        # Fetch from user info
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Fetching DocuSign account ID from user info")

            api_client = self.get_api_client()
            raw_user_info = api_client.get_user_info(self.get_access_token())
            user_info = parse_user_info(raw_user_info)

            if not user_info.accounts:
                raise DocusignAuthError("No DocuSign accounts found for user")

            # Use first account
            account = user_info.accounts[0]
            self.account_id = account.account_id

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "DocuSign account ID fetched successfully",
                {
                    "account_id": self.account_id,
                    "account_name": account.account_name,
                    "accounts_count": len(user_info.accounts),
                },
            )

            return self.account_id

        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"], "Failed to fetch DocuSign account ID", {"error": str(e)}
            )
            raise DocusignAuthError(f"Failed to fetch account ID: {str(e)}") from e


# Global JWT auth instance
_jwt_auth: DocusignJWTAuth | None = None


def get_jwt_auth() -> DocusignJWTAuth:
    """Get or create JWT auth instance"""
    global _jwt_auth

    if _jwt_auth is None:
        _jwt_auth = DocusignJWTAuth()

    return _jwt_auth
