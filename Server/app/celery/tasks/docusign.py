"""
DocuSign Celery tasks

Async tasks for DocuSign operations with automatic retry and error handling.
"""

import json
import uuid
from datetime import datetime, timezone

from app import db
from app.celery.celery_worker import celery
from app.models import Agreement, AgreementEvent, DocusignConnectEvent
from app.services.documents.s3_service import s3_service
from app.services.docusign import (
    DocusignClient,
    EnvelopeBuilder,
    TemplateSyncService,
    WebhookProcessor,
)
from app.services.docusign.errors import DocusignAPIError, DocusignAuthError
from logger import LOG_CATEGORIES, get_logger

logger = get_logger()

_SEND_FAILED_META_MAX = 2000


def _record_send_failure_event(
    agreement_id: str,
    actor_id: str,
    description: str,
    *,
    error_message: str,
    retryable: bool,
) -> None:
    """Persist a send failure on the agreement timeline (no envelope id yet)."""
    meta = json.dumps(
        {
            "error": error_message[:_SEND_FAILED_META_MAX],
            "retryable": retryable,
        }
    )
    event = AgreementEvent(
        id=str(uuid.uuid4()),
        agreement_id=agreement_id,
        event_type="send_failed",
        description=description,
        actor_id=actor_id,
        event_metadata=meta,
    )
    db.session.add(event)
    db.session.commit()


@celery.task(
    name="docusign.send_envelope",
    bind=True,
    max_retries=3,
    autoretry_for=(DocusignAPIError, ConnectionError),
    retry_backoff=True,
    retry_jitter=True,
)
def send_envelope_task(self, agreement_id: str, signing_method: str, actor_id: str):
    """
    Send agreement envelope to DocuSign.

    Automatically retries on transient failures with exponential backoff.
    Records a ``send_failed`` agreement event if the send cannot complete.

    Args:
        agreement_id: Agreement ID
        signing_method: 'embedded' or 'email'
        actor_id: User ID initiating send
    """
    agreement = None

    try:
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Sending envelope to DocuSign",
            {
                "agreement_id": agreement_id,
                "signing_method": signing_method,
                "actor_id": actor_id,
                "attempt": self.request.retries + 1,
                "max_retries": self.max_retries,
            },
        )

        # Load agreement
        agreement = Agreement.query.get(agreement_id)
        if not agreement:
            logger.error(
                LOG_CATEGORIES["ERRORS"], "Agreement not found", {"agreement_id": agreement_id}
            )
            return {"success": False, "error": "Agreement not found"}

        # Build envelope
        envelope_builder = EnvelopeBuilder(agreement, signing_method)
        envelope_definition = envelope_builder.build()

        # Send to DocuSign (use JWT auth)
        client = DocusignClient(auth_type="jwt")
        envelope_response = client.create_envelope(envelope_definition)

        # Update agreement with success
        agreement.docusign_envelope_id = envelope_response["envelopeId"]
        agreement.status = "sent"
        agreement.sent_at = datetime.now(timezone.utc)
        # Create event
        event = AgreementEvent(
            id=str(uuid.uuid4()),
            agreement_id=agreement_id,
            event_type="sent_to_docusign",
            description=f"Agreement sent for signature via {signing_method}",
            actor_id=actor_id,
        )

        db.session.add(event)
        db.session.commit()

        # Send in-app notification message in the agent-client conversation
        from app.services.docusign.notifications import send_agreement_message

        send_agreement_message(agreement, "sent")

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Envelope sent successfully to DocuSign",
            {
                "agreement_id": agreement_id,
                "envelope_id": envelope_response["envelopeId"],
                "signing_method": signing_method,
            },
        )

        return {"success": True, "envelope_id": envelope_response["envelopeId"]}

    except DocusignAuthError as exc:
        # Auth errors are NOT transient - don't retry
        error_msg = f"DocuSign authentication failed: {str(exc)}"

        if agreement:
            _record_send_failure_event(
                agreement_id,
                actor_id,
                "Failed to send agreement: DocuSign authentication error",
                error_message=str(exc),
                retryable=False,
            )

        logger.error(
            LOG_CATEGORIES["ERRORS"],
            "Auth error in send envelope task (not retrying)",
            {"agreement_id": agreement_id, "error": str(exc), "actor_id": actor_id},
        )

        # Don't raise - prevents infinite retries for non-retryable errors
        return {"success": False, "error": error_msg, "retryable": False}

    except DocusignAPIError as exc:
        # API errors might be transient - retry
        error_msg = f"DocuSign API error: {str(exc)}"

        logger.error(
            LOG_CATEGORIES["ERRORS"],
            "API error in send envelope task (retrying)",
            {
                "agreement_id": agreement_id,
                "error": str(exc),
                "attempt": self.request.retries + 1,
                "max_retries": self.max_retries,
                "status_code": exc.status_code if hasattr(exc, "status_code") else None,
            },
        )

        db.session.rollback()
        # Raise to trigger Celery retry
        raise self.retry(exc=exc, countdown=60 * (2**self.request.retries)) from exc

    except Exception as exc:
        # Unexpected error - don't retry
        error_msg = f"Unexpected error: {str(exc)}"

        if agreement:
            _record_send_failure_event(
                agreement_id,
                actor_id,
                "Failed to send agreement: unexpected error",
                error_message=str(exc),
                retryable=False,
            )

        logger.error(
            LOG_CATEGORIES["ERRORS"],
            "Unexpected error in send envelope task (not retrying)",
            {
                "agreement_id": agreement_id,
                "error": str(exc),
                "error_type": type(exc).__name__,
            },
        )

        # Don't raise - prevents infinite retries for non-retryable errors
        return {"success": False, "error": error_msg, "retryable": False}


@celery.task(name="docusign.process_webhook", bind=True, max_retries=5)
def process_webhook_task(self, event_id: str):
    """
    Process DocuSign Connect webhook event.

    Args:
        event_id: DocusignConnectEvent ID
    """
    try:
        WebhookProcessor.process_envelope_event(event_id)
        return {"success": True}

    except Exception as exc:
        logger.error(
            LOG_CATEGORIES["ERRORS"],
            "Webhook processing failed",
            {"event_id": event_id, "error": str(exc)},
        )

        # Update retry count
        try:
            event = DocusignConnectEvent.query.get(event_id)
            if event:
                event.retry_count += 1
                event.processing_error = str(exc)
                db.session.commit()
        except Exception as db_exc:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to update event retry count",
                {"event_id": event_id, "error": str(db_exc)},
            )

        raise self.retry(exc=exc, countdown=60 * (2**self.request.retries)) from exc


@celery.task(
    name="docusign.fetch_completed_documents",
    bind=True,
    max_retries=3,
    autoretry_for=(DocusignAPIError, ConnectionError),
    retry_backoff=True,
    retry_jitter=True,
)
def fetch_completed_documents_task(self, agreement_id: str):
    """
    Fetch signed documents and certificate after completion.

    Automatically retries on transient failures.

    Args:
        agreement_id: Agreement ID
    """
    agreement = None

    try:
        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Fetching completed documents from DocuSign",
            {"agreement_id": agreement_id, "attempt": self.request.retries + 1},
        )

        agreement = Agreement.query.get(agreement_id)
        if not agreement or not agreement.docusign_envelope_id:
            logger.error(
                LOG_CATEGORIES["ERRORS"], "Cannot fetch documents", {"agreement_id": agreement_id}
            )
            return {"success": False, "error": "Invalid agreement"}

        client = DocusignClient(auth_type="jwt")

        # Fetch combined PDF
        documents_response = client.get_envelope_documents(agreement.docusign_envelope_id)

        # Upload to S3
        s3_key = f"agreements/{agreement_id}/signed/{agreement.docusign_envelope_id}.pdf"
        uploaded_key = s3_service.upload_pdf(
            documents_response["combined_pdf"], s3_key, content_type="application/pdf"
        )
        if not uploaded_key:
            raise Exception("Failed to upload signed document to S3")

        # Fetch certificate
        try:
            certificate_response = client.get_envelope_certificate(agreement.docusign_envelope_id)
            cert_s3_key = (
                f"agreements/{agreement_id}/certificates/{agreement.docusign_envelope_id}_cert.pdf"
            )
            cert_uploaded = s3_service.upload_pdf(
                certificate_response["pdf"], cert_s3_key, content_type="application/pdf"
            )
            if cert_uploaded:
                agreement.certificate_path = cert_s3_key
        except Exception as e:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Failed to fetch certificate from DocuSign",
                {"agreement_id": agreement_id, "error": str(e)},
            )

        # Update agreement
        agreement.signed_document_path = s3_key
        db.session.commit()

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Documents fetched successfully from DocuSign",
            {
                "agreement_id": agreement_id,
                "has_signed_doc": bool(agreement.signed_document_path),
                "has_certificate": bool(agreement.certificate_path),
            },
        )

        return {"success": True}

    except DocusignAPIError as exc:
        # Retry on API errors
        logger.error(
            LOG_CATEGORIES["ERRORS"],
            "API error fetching documents (retrying)",
            {
                "agreement_id": agreement_id,
                "error": str(exc),
                "attempt": self.request.retries + 1,
            },
        )

        raise self.retry(exc=exc, countdown=120 * (2**self.request.retries)) from exc

    except Exception as exc:
        # Don't retry on unexpected errors
        logger.error(
            LOG_CATEGORIES["ERRORS"],
            "Unexpected error fetching documents (not retrying)",
            {"agreement_id": agreement_id, "error": str(exc)},
        )

        return {"success": False, "error": str(exc)}


@celery.task(name="docusign.sync_templates")
def sync_templates_task():
    """Sync templates from DocuSign"""
    try:
        count = TemplateSyncService.sync_all_templates()
        return {"success": True, "count": count}

    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Template sync failed", {"error": str(e)})
        return {"success": False, "error": str(e)}
