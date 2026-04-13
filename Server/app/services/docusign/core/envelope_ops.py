"""DocuSign envelope API operations (create, get, void, recipient view, documents, certificate)."""

from collections.abc import Callable
from typing import Any

from docusign_esign import (
    ApiClient,
    EnvelopeDefinition,
    EnvelopesApi,
    RecipientViewRequest,
    ReturnUrlRequest,
)
from docusign_esign import (
    Envelope as EnvelopeModel,
)
from docusign_esign.client.api_exception import ApiException

from logger import LOG_CATEGORIES, get_logger

logger = get_logger()


def _handle(handle_exception: Callable[[ApiException, str], None], e: ApiException, op: str):
    handle_exception(e, op)
    raise AssertionError("handle_exception must raise")


def create_envelope(
    api_client: ApiClient,
    account_id: str,
    envelope_definition: EnvelopeDefinition,
    handle_exception: Callable[[ApiException, str], None],
) -> dict[str, Any]:
    """Create envelope in DocuSign."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Creating DocuSign envelope",
            {
                "account_id": account_id,
                "document_count": len(envelope_definition.documents)
                if envelope_definition.documents
                else 0,
                "email_subject": envelope_definition.email_subject,
            },
        )
        envelopes_api = EnvelopesApi(api_client)
        results = envelopes_api.create_envelope(
            account_id=account_id, envelope_definition=envelope_definition
        )
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "DocuSign envelope created successfully",
            {
                "envelope_id": results.envelope_id,
                "status": results.status,
                "account_id": account_id,
            },
        )
        return {
            "envelopeId": results.envelope_id,
            "status": results.status,
            "statusDateTime": results.status_date_time,
        }
    except ApiException as e:
        _handle(handle_exception, e, "create envelope")
        return {}


def get_envelope(
    api_client: ApiClient,
    account_id: str,
    envelope_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> dict[str, Any]:
    """Get envelope status and details."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Getting envelope status",
            {"envelope_id": envelope_id, "account_id": account_id},
        )
        envelopes_api = EnvelopesApi(api_client)
        envelope = envelopes_api.get_envelope(account_id=account_id, envelope_id=envelope_id)
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Envelope status retrieved",
            {"envelope_id": envelope_id, "status": envelope.status},
        )
        return {
            "envelopeId": envelope.envelope_id,
            "status": envelope.status,
            "statusDateTime": envelope.status_date_time,
            "sentDateTime": envelope.sent_date_time,
            "completedDateTime": envelope.completed_date_time,
            "voidedDateTime": envelope.voided_date_time,
        }
    except ApiException as e:
        _handle(handle_exception, e, "get envelope")
        return {}


def void_envelope(
    api_client: ApiClient,
    account_id: str,
    envelope_id: str,
    reason: str,
    handle_exception: Callable[[ApiException, str], None],
) -> dict[str, Any]:
    """Void an envelope."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Voiding envelope",
            {"envelope_id": envelope_id, "reason": reason, "account_id": account_id},
        )
        envelopes_api = EnvelopesApi(api_client)
        envelope = EnvelopeModel(status="voided", voided_reason=reason)
        results = envelopes_api.update(
            account_id=account_id, envelope_id=envelope_id, envelope=envelope
        )
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Envelope voided successfully",
            {"envelope_id": envelope_id, "reason": reason},
        )
        return {"envelopeId": results.envelope_id, "status": results.status}
    except ApiException as e:
        _handle(handle_exception, e, "void envelope")
        return {}


def create_recipient_view(
    api_client: ApiClient,
    account_id: str,
    envelope_id: str,
    recipient: dict[str, Any],
    return_url: str,
    handle_exception: Callable[[ApiException, str], None],
) -> str:
    """Create embedded signing URL for recipient."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Creating recipient view",
            {
                "envelope_id": envelope_id,
                "recipient_email": recipient.get("email"),
                "recipient_id": recipient.get("recipientId"),
                "account_id": account_id,
            },
        )
        view_request = RecipientViewRequest(
            authentication_method="none",
            client_user_id=recipient.get("clientUserId", recipient["recipientId"]),
            recipient_id=recipient["recipientId"],
            return_url=return_url,
            user_name=recipient["name"],
            email=recipient["email"],
        )
        envelopes_api = EnvelopesApi(api_client)
        results = envelopes_api.create_recipient_view(
            account_id=account_id,
            envelope_id=envelope_id,
            recipient_view_request=view_request,
        )
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Recipient view created successfully",
            {"envelope_id": envelope_id, "recipient_email": recipient.get("email")},
        )
        return results.url
    except ApiException as e:
        _handle(handle_exception, e, "create recipient view")
        return ""


def get_sender_view(
    api_client: ApiClient,
    account_id: str,
    envelope_id: str,
    return_url: str,
    handle_exception: Callable[[ApiException, str], None],
) -> str:
    """Create sender/correction view URL."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Creating sender view",
            {"envelope_id": envelope_id, "account_id": account_id},
        )
        view_request = ReturnUrlRequest(return_url=return_url)
        envelopes_api = EnvelopesApi(api_client)
        results = envelopes_api.create_sender_view(
            account_id=account_id, envelope_id=envelope_id, return_url_request=view_request
        )
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Sender view created successfully",
            {"envelope_id": envelope_id},
        )
        return results.url
    except ApiException as e:
        _handle(handle_exception, e, "create sender view")
        return ""


def get_envelope_documents(
    api_client: ApiClient,
    account_id: str,
    envelope_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> dict[str, Any]:
    """Get envelope documents (combined PDF)."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Fetching envelope documents",
            {"envelope_id": envelope_id, "account_id": account_id},
        )
        envelopes_api = EnvelopesApi(api_client)
        pdf_bytes = envelopes_api.get_document(
            account_id=account_id, envelope_id=envelope_id, document_id="combined"
        )
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Envelope documents fetched successfully",
            {
                "envelope_id": envelope_id,
                "size_bytes": len(pdf_bytes),
                "size_kb": len(pdf_bytes) / 1024,
            },
        )
        return {"combined_pdf": pdf_bytes, "envelope_id": envelope_id}
    except ApiException as e:
        _handle(handle_exception, e, "get envelope documents")
        return {}


def get_envelope_certificate(
    api_client: ApiClient,
    account_id: str,
    envelope_id: str,
    handle_exception: Callable[[ApiException, str], None],
) -> dict[str, Any]:
    """Get certificate of completion."""
    try:
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Fetching envelope certificate",
            {"envelope_id": envelope_id, "account_id": account_id},
        )
        envelopes_api = EnvelopesApi(api_client)
        cert_bytes = envelopes_api.get_document(
            account_id=account_id, envelope_id=envelope_id, document_id="certificate"
        )
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Envelope certificate fetched successfully",
            {
                "envelope_id": envelope_id,
                "size_bytes": len(cert_bytes),
                "size_kb": len(cert_bytes) / 1024,
            },
        )
        return {"pdf": cert_bytes, "envelope_id": envelope_id}
    except ApiException as e:
        _handle(handle_exception, e, "get envelope certificate")
        return {}
