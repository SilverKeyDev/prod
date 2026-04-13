"""
DocuSign OAuth authentication

Implements OAuth 2.0 authentication for per-agent operations.
"""

from datetime import datetime, timedelta, timezone

from docusign_esign import ApiClient

from app import db
from app.config import Config
from app.models import DocusignOAuthToken
from logger import LOG_CATEGORIES, get_logger

from ..errors import DocusignAuthError
from .api_client_rest import configure_rest_api_root
from .auth_oauth_flow import (
    build_auth_url as flow_build_auth_url,
)
from .auth_oauth_flow import (
    exchange_code_for_tokens as flow_exchange_code_for_tokens,
)
from .auth_oauth_flow import (
    extract_user_id_from_state as flow_extract_user_id_from_state,
)

logger = get_logger()


class DocusignOAuthService:
    """OAuth-based authentication for DocuSign (per-agent operations)."""

    @staticmethod
    def build_auth_url(user_id: str) -> tuple[str, str]:
        """Build OAuth authorization URL for user."""
        return flow_build_auth_url(user_id)

    @staticmethod
    def extract_user_id_from_state(state: str) -> str:
        """Extract user ID from state token."""
        return flow_extract_user_id_from_state(state)

    @staticmethod
    def exchange_code_for_tokens(user_id: str, code: str) -> DocusignOAuthToken:
        """Exchange authorization code for access and refresh tokens."""
        return flow_exchange_code_for_tokens(user_id, code)

    @staticmethod
    def refresh_token(token: DocusignOAuthToken) -> DocusignOAuthToken:
        """
        Refresh OAuth access token.

        Args:
            token: DocusignOAuthToken model

        Returns:
            Updated token
        """
        try:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Refreshing OAuth token",
                {
                    "user_id": token.user_id,
                    "current_expires_at": token.token_expires_at.isoformat()
                    if token.token_expires_at
                    else None,
                },
            )

            # Create API client
            api_client = ApiClient()
            oauth_host = (
                Config.DOCUSIGN_BASE_URL.replace("https://", "")
                .replace("http://", "")
                .replace("/restapi", "")
            )
            api_client.set_oauth_host_name(oauth_host)

            # Refresh token (ApiClient has refresh_access_token at runtime; stubs may not declare it)
            oauth_response = api_client.refresh_access_token(  # pyright: ignore[reportAttributeAccessIssue]
                client_id=Config.DOCUSIGN_CLIENT_ID,
                client_secret=Config.DOCUSIGN_CLIENT_SECRET,
                refresh_token=token.refresh_token,
            )

            # Update token (see note above about encryption)
            token.access_token = oauth_response.access_token
            new_refresh_token = bool(oauth_response.refresh_token)
            if oauth_response.refresh_token:  # New refresh token might be provided
                token.refresh_token = oauth_response.refresh_token
            token.token_expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=oauth_response.expires_in
            )

            db.session.commit()

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "OAuth token refreshed successfully",
                {
                    "user_id": token.user_id,
                    "new_expires_at": token.token_expires_at.isoformat(),
                    "new_refresh_token_provided": new_refresh_token,
                },
            )

            return token

        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "Token refresh failed",
                {"error": str(e), "user_id": token.user_id},
            )
            raise DocusignAuthError(f"Token refresh failed: {str(e)}") from e

    @staticmethod
    def get_valid_token(user_id: str) -> DocusignOAuthToken | None:
        """
        Get valid access token for user, refreshing if necessary.

        Args:
            user_id: User ID

        Returns:
            DocusignOAuthToken or None if not connected
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Getting valid OAuth token", {"user_id": user_id})

        token = DocusignOAuthToken.query.filter_by(user_id=user_id).first()

        if not token:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"], "No OAuth token found for user", {"user_id": user_id}
            )
            return None

        # Check if token is expired (with 5 minute buffer)
        buffer = timedelta(minutes=5)
        is_expired = datetime.now(timezone.utc) >= (token.token_expires_at - buffer)

        if is_expired:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "OAuth token expired, refreshing",
                {"user_id": user_id, "expired_at": token.token_expires_at.isoformat()},
            )
            # Refresh token
            token = DocusignOAuthService.refresh_token(token)
        else:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "OAuth token is valid",
                {"user_id": user_id, "expires_at": token.token_expires_at.isoformat()},
            )

        return token

    @staticmethod
    def disconnect(user_id: str):
        """
        Disconnect user's DocuSign OAuth.

        Args:
            user_id: User ID
        """
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"], "Disconnecting DocuSign OAuth", {"user_id": user_id}
        )

        token = DocusignOAuthToken.query.filter_by(user_id=user_id).first()

        if token:
            db.session.delete(token)
            db.session.commit()

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "DocuSign OAuth disconnected successfully",
                {"user_id": user_id, "account_id": token.account_id},
            )
        else:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "No OAuth token found to disconnect",
                {"user_id": user_id},
            )

    @staticmethod
    def api_client_for_token(token: DocusignOAuthToken) -> ApiClient:
        """
        Build an ApiClient that uses the access token and base URI from a token row.

        Callers should obtain ``token`` via :meth:`get_valid_token` once and use both
        this method and ``token.account_id`` so the client and account ID stay in sync.
        """
        api_client = ApiClient()
        configure_rest_api_root(api_client, token.base_uri)
        api_client.set_default_header("Authorization", f"Bearer {token.access_token}")

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "OAuth API client created successfully",
            {"user_id": token.user_id, "base_uri": token.base_uri},
        )

        return api_client

    @staticmethod
    def get_api_client(user_id: str) -> ApiClient | None:
        """
        Get configured API client for user with OAuth token.

        Args:
            user_id: User ID

        Returns:
            Configured ApiClient or None if not connected
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating OAuth API client", {"user_id": user_id})

        token = DocusignOAuthService.get_valid_token(user_id)

        if not token:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Cannot create API client - no valid token",
                {"user_id": user_id},
            )
            return None

        return DocusignOAuthService.api_client_for_token(token)
