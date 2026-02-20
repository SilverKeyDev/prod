"""
DocuSign API client

Low-level DocuSign API client wrapper.
"""

from typing import Any, cast

from docusign_esign import EnvelopeDefinition
from docusign_esign.client.api_exception import ApiException

from logger import LOG_CATEGORIES, get_logger

from ..errors import DocusignAPIError, DocusignAuthError
from . import envelope_ops, template_ops
from .auth_jwt import get_jwt_auth
from .auth_oauth import DocusignOAuthService

logger = get_logger()


class DocusignClient:
    """
    Low-level DocuSign API client.

    Supports both JWT (service account) and OAuth (per-user) authentication.
    """

    def __init__(self, auth_type: str = "jwt", user_id: str | None = None):
        """
        Initialize DocuSign client.

        Args:
            auth_type: 'jwt' or 'oauth'
            user_id: Required if auth_type is 'oauth'
        """
        self.auth_type = auth_type
        self.user_id = user_id

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Initializing DocuSign client",
            {"auth_type": auth_type, "user_id": user_id},
        )

        if auth_type == "jwt":
            self.jwt_auth = get_jwt_auth()
            self.api_client = self.jwt_auth.get_api_client()
            self.account_id = self.jwt_auth.get_account_id()

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "DocuSign client initialized with JWT",
                {"account_id": self.account_id},
            )
        elif auth_type == "oauth":
            if not user_id:
                raise DocusignAuthError("user_id required for OAuth authentication")

            self.api_client = DocusignOAuthService.get_api_client(user_id)
            if not self.api_client:
                raise DocusignAuthError(f"User {user_id} not connected to DocuSign")

            token = DocusignOAuthService.get_valid_token(user_id)
            self.account_id = token.account_id if token else None

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "DocuSign client initialized with OAuth",
                {"user_id": user_id, "account_id": self.account_id},
            )
        else:
            raise ValueError(f"Invalid auth_type: {auth_type}")

        if not self.account_id:
            raise DocusignAuthError("DocuSign account ID not available")

    def _handle_api_exception(self, e: ApiException, operation: str):
        """Handle DocuSign API exception"""
        logger.error(
            LOG_CATEGORIES["ERRORS"],
            f"DocuSign API error: {operation}",
            {
                "operation": operation,
                "status": e.status,
                "reason": e.reason,
                "body": e.body,
                "auth_type": self.auth_type,
                "account_id": self.account_id,
            },
        )

        raise DocusignAPIError(
            f"DocuSign {operation} failed: {e.reason}", status_code=e.status, response_body=e.body
        )

    # Envelope operations

    def create_envelope(self, envelope_definition: EnvelopeDefinition) -> dict[str, Any]:
        return envelope_ops.create_envelope(
            self.api_client,
            cast(str, self.account_id),
            envelope_definition,
            self._handle_api_exception,
        )

    def get_envelope(self, envelope_id: str) -> dict[str, Any]:
        return envelope_ops.get_envelope(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            self._handle_api_exception,
        )

    def void_envelope(self, envelope_id: str, reason: str) -> dict[str, Any]:
        return envelope_ops.void_envelope(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            reason,
            self._handle_api_exception,
        )

    def create_recipient_view(
        self, envelope_id: str, recipient: dict[str, Any], return_url: str
    ) -> str:
        return envelope_ops.create_recipient_view(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            recipient,
            return_url,
            self._handle_api_exception,
        )

    def get_sender_view(self, envelope_id: str, return_url: str) -> str:
        return envelope_ops.get_sender_view(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            return_url,
            self._handle_api_exception,
        )

    def get_envelope_documents(self, envelope_id: str) -> dict[str, Any]:
        return envelope_ops.get_envelope_documents(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            self._handle_api_exception,
        )

    def get_envelope_certificate(self, envelope_id: str) -> dict[str, Any]:
        return envelope_ops.get_envelope_certificate(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            self._handle_api_exception,
        )

    # Template operations

    def list_templates(self) -> list[dict[str, Any]]:
        return template_ops.list_templates(
            self.api_client, cast(str, self.account_id), self._handle_api_exception
        )

    def get_template(self, template_id: str) -> dict[str, Any]:
        return template_ops.get_template(
            self.api_client,
            cast(str, self.account_id),
            template_id,
            self._handle_api_exception,
        )
