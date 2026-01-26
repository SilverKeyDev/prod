"""
DocuSign Celery tasks

Async tasks for DocuSign operations.
"""

import uuid
from datetime import datetime, timezone

from app.celery.celery_worker import celery
from app import db
from app.models import Agreement, AgreementEvent, DocusignConnectEvent
from app.services.docusign import (
    EnvelopeBuilder,
    DocusignClient,
    WebhookProcessor,
    TemplateSyncService
)
from app.services.documents.s3_service import s3_service
from logger import get_logger, LOG_CATEGORIES

logger = get_logger()


@celery.task(name='docusign.send_envelope', bind=True, max_retries=3)
def send_envelope_task(self, agreement_id: str, signing_method: str, actor_id: str):
    """
    Send agreement envelope to DocuSign.
    
    Args:
        agreement_id: Agreement ID
        signing_method: 'embedded' or 'email'
        actor_id: User ID initiating send
    """
    try:
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Sending envelope to DocuSign", {
            "agreement_id": agreement_id,
            "signing_method": signing_method,
            "actor_id": actor_id
        })
        
        # Load agreement
        agreement = Agreement.query.get(agreement_id)
        if not agreement:
            logger.error(LOG_CATEGORIES["ERRORS"], "Agreement not found", {
                "agreement_id": agreement_id
            })
            return {'success': False, 'error': 'Agreement not found'}
        
        # Build envelope
        envelope_builder = EnvelopeBuilder(agreement, signing_method)
        envelope_definition = envelope_builder.build()
        
        # Send to DocuSign (use JWT auth)
        client = DocusignClient(auth_type='jwt')
        envelope_response = client.create_envelope(envelope_definition)
        
        # Update agreement
        agreement.docusign_envelope_id = envelope_response['envelopeId']
        agreement.status = 'sent'
        agreement.sent_at = datetime.now(timezone.utc)
        
        # Create event
        event = AgreementEvent(
            id=str(uuid.uuid4()),
            agreement_id=agreement_id,
            event_type='sent_to_docusign',
            description=f"Agreement sent for signature via {signing_method}",
            actor_id=actor_id
        )
        
        db.session.add(event)
        db.session.commit()
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Envelope sent successfully to DocuSign", {
            "agreement_id": agreement_id,
            "envelope_id": envelope_response['envelopeId'],
            "signing_method": signing_method
        })
        
        return {
            'success': True,
            'envelope_id': envelope_response['envelopeId']
        }
        
    except Exception as exc:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to send envelope", {
            "agreement_id": agreement_id,
            "error": str(exc)
        })
        db.session.rollback()
        raise self.retry(exc=exc, countdown=60)


@celery.task(name='docusign.process_webhook', bind=True, max_retries=5)
def process_webhook_task(self, event_id: str):
    """
    Process DocuSign Connect webhook event.
    
    Args:
        event_id: DocusignConnectEvent ID
    """
    try:
        WebhookProcessor.process_envelope_event(event_id)
        return {'success': True}
        
    except Exception as exc:
        logger.error(LOG_CATEGORIES["ERRORS"], "Webhook processing failed", {
            "event_id": event_id,
            "error": str(exc)
        })
        
        # Update retry count
        try:
            event = DocusignConnectEvent.query.get(event_id)
            if event:
                event.retry_count += 1
                event.processing_error = str(exc)
                db.session.commit()
        except Exception as db_exc:
            logger.error(LOG_CATEGORIES["ERRORS"], "Failed to update event retry count", {
                "event_id": event_id,
                "error": str(db_exc)
            })
        
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@celery.task(name='docusign.fetch_completed_documents', bind=True, max_retries=3)
def fetch_completed_documents_task(self, agreement_id: str):
    """
    Fetch signed documents and certificate after completion.
    
    Args:
        agreement_id: Agreement ID
    """
    try:
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Fetching completed documents from DocuSign", {
            "agreement_id": agreement_id
        })
        
        agreement = Agreement.query.get(agreement_id)
        if not agreement or not agreement.docusign_envelope_id:
            logger.error(LOG_CATEGORIES["ERRORS"], "Cannot fetch documents", {
                "agreement_id": agreement_id
            })
            return {'success': False, 'error': 'Invalid agreement'}
        
        client = DocusignClient(auth_type='jwt')
        
        # Fetch combined PDF
        documents_response = client.get_envelope_documents(agreement.docusign_envelope_id)
        
        # Upload to S3
        s3_key = f"agreements/{agreement_id}/signed/{agreement.docusign_envelope_id}.pdf"
        uploaded_key = s3_service.upload_pdf(
            documents_response['combined_pdf'],
            s3_key,
            content_type='application/pdf'
        )
        if not uploaded_key:
            raise Exception("Failed to upload signed document to S3")
        
        # Fetch certificate
        try:
            certificate_response = client.get_envelope_certificate(agreement.docusign_envelope_id)
            cert_s3_key = f"agreements/{agreement_id}/certificates/{agreement.docusign_envelope_id}_cert.pdf"
            cert_uploaded = s3_service.upload_pdf(
                certificate_response['pdf'],
                cert_s3_key,
                content_type='application/pdf'
            )
            if cert_uploaded:
                agreement.certificate_path = cert_s3_key
        except Exception as e:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Failed to fetch certificate from DocuSign", {
                "agreement_id": agreement_id,
                "error": str(e)
            })
        
        # Update agreement
        agreement.signed_document_path = s3_key
        db.session.commit()
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Documents fetched successfully from DocuSign", {
            "agreement_id": agreement_id,
            "has_signed_doc": bool(agreement.signed_document_path),
            "has_certificate": bool(agreement.certificate_path)
        })
        
        return {'success': True}
        
    except Exception as exc:
        logger.error(LOG_CATEGORIES["ERRORS"], "Failed to fetch documents", {
            "agreement_id": agreement_id,
            "error": str(exc)
        })
        raise self.retry(exc=exc, countdown=120)


@celery.task(name='docusign.sync_templates')
def sync_templates_task():
    """Sync templates from DocuSign"""
    try:
        count = TemplateSyncService.sync_all_templates()
        return {'success': True, 'count': count}
        
    except Exception as e:
        logger.error(LOG_CATEGORIES["ERRORS"], "Template sync failed", {
            "error": str(e)
        })
        return {'success': False, 'error': str(e)}
