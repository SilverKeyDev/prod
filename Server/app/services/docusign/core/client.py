"""
DocuSign API client

Low-level DocuSign API client wrapper with automatic retry logic.
"""

import json
from typing import Any, cast

from docusign_esign import (
    EnvelopeDefinition,
    EnvelopeNotificationRequest,
    PrefillTabs,
    Recipients,
)
from docusign_esign.client.api_exception import ApiException
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from logger import log
from logger.bootstrap.infrastructure import INFRA_LOG_INFO, get_infrastructure_logger

from ..errors import AgreementStateError, DocusignAPIError, DocusignAuthError
from . import envelope_ops, template_ops
from .auth_jwt import get_jwt_auth
from .auth_oauth import DocusignOAuthService

_tenacity_logger = get_infrastructure_logger("app.docusign.retry")


def _docusign_api_error_payload(body: object) -> dict[str, Any]:
    if body is None:
        return {}
    if isinstance(body, bytes):
        try:
            body = body.decode("utf-8")
        except UnicodeDecodeError:
            return {}
    if not isinstance(body, str):
        return {}
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def is_retryable_api_exception(exception):
    """Check if API exception is retryable (transient error)."""
    if not isinstance(exception, ApiException):
        return False

    # Retry on server errors (5xx) and rate limits (429)
    retryable_codes = [429, 500, 502, 503, 504]
    return exception.status in retryable_codes


# Retry configuration for transient failures
retry_config = {
    "retry": retry_if_exception(is_retryable_api_exception)
    | retry_if_exception(lambda e: isinstance(e, ConnectionError)),
    "stop": stop_after_attempt(3),
    "wait": wait_exponential(multiplier=1, min=1, max=10),
    "before_sleep": before_sleep_log(_tenacity_logger, INFRA_LOG_INFO),
    "reraise": True,
}


class DocusignClient:
    """
    Low-level DocuSign API client with automatic retry.

    Supports both JWT (service account) and OAuth (per-user) authentication.

    Automatically retries transient failures:
    - Connection errors
    - 429 (rate limit)
    - 5xx (server errors)
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

        log.debug(
            "DOCUSIGN",
            "Initializing DocuSign client",
            {"auth_type": auth_type, "user_id": user_id},
        )

        if auth_type == "jwt":
            self.jwt_auth = get_jwt_auth()
            self.api_client = self.jwt_auth.get_api_client()
            self.account_id = self.jwt_auth.get_account_id()

            log.info(
                "DOCUSIGN",
                "DocuSign client initialized with JWT",
                {"account_id": self.account_id},
            )
        elif auth_type == "oauth":
            if not user_id:
                raise DocusignAuthError("user_id required for OAuth authentication")

            token = DocusignOAuthService.get_valid_token(user_id)
            if not token:
                raise DocusignAuthError(f"User {user_id} not connected to DocuSign")

            self.api_client = DocusignOAuthService.api_client_for_token(token)
            self.account_id = token.account_id

            log.info(
                "DOCUSIGN",
                "DocuSign client initialized with OAuth",
                {"user_id": user_id, "account_id": self.account_id},
            )
        else:
            raise ValueError(f"Invalid auth_type: {auth_type}")

        if not self.account_id:
            raise DocusignAuthError("DocuSign account ID not available")

    def _handle_api_exception(self, e: ApiException, operation: str):
        """Handle DocuSign API exception"""
        payload = _docusign_api_error_payload(e.body)
        error_code = payload.get("errorCode")
        if error_code == "ENVELOPE_CANNOT_VOID_INVALID_STATE" and operation == "void envelope":
            message = payload.get("message") or (
                "Only envelopes in the Sent or Delivered states may be voided."
            )
            log.warn(
                "DOCUSIGN",
                "DocuSign void rejected: invalid envelope state",
                {
                    "operation": operation,
                    "error_code": error_code,
                    "auth_type": self.auth_type,
                    "account_id": self.account_id,
                },
            )
            raise AgreementStateError(message)

        log.error(
            "ERRORS",
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

    # Envelope operations (with automatic retry on transient failures)

    @retry(**retry_config)
    def create_envelope(
        self,
        envelope_definition: EnvelopeDefinition,
        prefill_tabs: PrefillTabs | None = None,
    ) -> dict[str, Any]:
        """
        Create envelope with automatic retry.

        Retries up to 3 times with exponential backoff on:
        - Connection errors
        - Rate limits (429)
        - Server errors (5xx)
        """
        return envelope_ops.create_envelope(
            self.api_client,
            cast(str, self.account_id),
            envelope_definition,
            self._handle_api_exception,
            prefill_tabs=prefill_tabs,
        )

    @retry(**retry_config)
    def get_envelope(self, envelope_id: str) -> dict[str, Any]:
        """Get envelope status with automatic retry."""
        return envelope_ops.get_envelope(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def void_envelope(self, envelope_id: str, reason: str) -> dict[str, Any]:
        """Void envelope with automatic retry."""
        return envelope_ops.void_envelope(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            reason,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def create_recipient_view(
        self, envelope_id: str, recipient: dict[str, Any], return_url: str
    ) -> str:
        """Get signing URL with automatic retry."""
        return envelope_ops.create_recipient_view(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            recipient,
            return_url,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def get_sender_view(self, envelope_id: str, return_url: str) -> str:
        """Get sender view URL with automatic retry."""
        return envelope_ops.get_sender_view(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            return_url,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def get_envelope_documents(self, envelope_id: str) -> dict[str, Any]:
        """Get signed documents with automatic retry."""
        return envelope_ops.get_envelope_documents(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def get_envelope_certificate(self, envelope_id: str) -> dict[str, Any]:
        """Get certificate of completion with automatic retry."""
        return envelope_ops.get_envelope_certificate(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def update_notification_settings(
        self, envelope_id: str, envelope_notification_request: EnvelopeNotificationRequest
    ) -> dict[str, Any]:
        """Update reminder/expiration settings on an existing envelope."""
        return envelope_ops.update_notification_settings(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            envelope_notification_request,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def update_recipients_resend(self, envelope_id: str, recipients: Recipients) -> dict[str, Any]:
        """Trigger DocuSign to resend the envelope to the given recipient(s)."""
        return envelope_ops.update_recipients_resend(
            self.api_client,
            cast(str, self.account_id),
            envelope_id,
            recipients,
            self._handle_api_exception,
        )

    # Template operations (with automatic retry)

    @retry(**retry_config)
    def list_templates(self) -> list[dict[str, Any]]:
        """List templates with automatic retry."""
        return template_ops.list_templates(
            self.api_client, cast(str, self.account_id), self._handle_api_exception
        )

    @retry(**retry_config)
    def get_template(self, template_id: str) -> dict[str, Any]:
        """Get template details with automatic retry."""
        return template_ops.get_template(
            self.api_client,
            cast(str, self.account_id),
            template_id,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def create_template_from_pdfs(
        self,
        *,
        name: str,
        description: str | None,
        pdf_files: list[tuple[str, bytes]],
        role_names: list[str],
    ) -> dict[str, Any]:
        """Create a DocuSign envelope template (multi-document)."""
        return template_ops.create_template_from_pdfs(
            self.api_client,
            cast(str, self.account_id),
            self._handle_api_exception,
            name=name,
            description=description,
            pdf_files=pdf_files,
            role_names=role_names,
        )

    @retry(**retry_config)
    def delete_docusign_template(self, template_id: str) -> None:
        """Permanently delete a template in DocuSign."""
        return template_ops.delete_template(
            self.api_client,
            cast(str, self.account_id),
            template_id,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def create_template_edit_view(self, template_id: str, return_url: str) -> str:
        """URL for DocuSign template editor."""
        return template_ops.create_template_edit_view(
            self.api_client,
            cast(str, self.account_id),
            template_id,
            return_url,
            self._handle_api_exception,
        )

    @retry(**retry_config)
    def get_template_role_name_set(self, template_id: str) -> set[str]:
        """Role names defined on the template (for send validation)."""
        return template_ops.get_template_role_name_set(
            self.api_client,
            cast(str, self.account_id),
            template_id,
            self._handle_api_exception,
        )
