"""
DocuSign webhook processor

Process DocuSign Connect webhook events and update agreement state.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from app import db
from app.models import (
    Agreement,
    AgreementParticipant,
    AgreementEvent,
    DocusignConnectEvent
)
from logger import get_logger, LOG_CATEGORIES
from ..errors import DocusignError

logger = get_logger()


class WebhookProcessor:
    """Process DocuSign Connect webhook events"""
    
    @staticmethod
    def process_envelope_event(event_id: str):
        """
        Process a stored webhook event.
        
        Args:
            event_id: DocusignConnectEvent ID
        """
        try:
            # Load event
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Loading webhook event for processing", {
                "event_id": event_id
            })
            
            event = DocusignConnectEvent.query.get(event_id)
            if not event:
                logger.error(LOG_CATEGORIES["ERRORS"], "Webhook event not found", {
                    "event_id": event_id
                })
                return
            
            if event.processed:
                logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Webhook event already processed", {
                    "event_id": event_id,
                    "envelope_id": event.envelope_id
                })
                return
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Processing webhook event", {
                "event_id": event_id,
                "envelope_id": event.envelope_id,
                "event_type": event.event_type,
                "event_timestamp": event.event_timestamp
            })
            
            # Parse payload
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Parsing webhook payload", {
                "event_id": event_id,
                "payload_size": len(event.payload)
            })
            
            try:
                payload = json.loads(event.payload)
            except json.JSONDecodeError as e:
                logger.error(LOG_CATEGORIES["ERRORS"], "Failed to parse webhook payload", {
                    "event_id": event_id,
                    "error": str(e)
                })
                event.processing_error = f"JSON parse error: {str(e)}"
                db.session.commit()
                return
            
            # Find agreement by envelope ID
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Looking up agreement by envelope ID", {
                "event_id": event_id,
                "envelope_id": event.envelope_id
            })
            
            agreement = Agreement.query.filter_by(
                docusign_envelope_id=event.envelope_id
            ).first()
            
            if not agreement:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Agreement not found for envelope", {
                    "event_id": event_id,
                    "envelope_id": event.envelope_id
                })
                event.processing_error = "Agreement not found"
                db.session.commit()
                return
            
            # Process based on event type
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Processing event for agreement", {
                "event_id": event_id,
                "agreement_id": agreement.id,
                "event_type": event.event_type
            })
            
            WebhookProcessor._process_event(agreement, payload, event.event_type)
            
            # Mark event as processed
            event.processed = True
            event.processed_at = datetime.now(timezone.utc)
            event.processing_error = None
            
            db.session.commit()
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Webhook event processed successfully", {
                "event_id": event_id,
                "agreement_id": agreement.id,
                "envelope_id": event.envelope_id,
                "event_type": event.event_type
            })
            
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Webhook processing failed", {
                "event_id": event_id,
                "error": str(e)
            })
            
            # Update error
            try:
                event = DocusignConnectEvent.query.get(event_id)
                if event:
                    event.processing_error = str(e)
                    db.session.commit()
            except Exception as db_exc:
                logger.error(LOG_CATEGORIES["ERRORS"], "Failed to update event error", {
                    "event_id": event_id,
                    "error": str(db_exc)
                })
            
            raise
    
    @staticmethod
    def _process_event(agreement: Agreement, payload: Dict[str, Any], event_type: str):
        """Process specific event type"""
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Processing envelope status update", {
            "agreement_id": agreement.id,
            "event_type": event_type,
            "current_status": agreement.status
        })
        
        # Extract envelope and recipient data
        envelope_data = payload.get('envelopeStatus') or payload.get('data', {}).get('envelopeSummary', {})
        
        # Update agreement status
        old_status = agreement.status
        new_docusign_status = envelope_data.get('status')
        
        if new_docusign_status:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Updating agreement status", {
                "agreement_id": agreement.id,
                "old_status": old_status,
                "new_docusign_status": new_docusign_status
            })
            
            agreement.docusign_status = new_docusign_status
            
            # Map DocuSign status to our status
            status_mapping = {
                'sent': 'sent',
                'delivered': 'delivered',
                'completed': 'completed',
                'declined': 'declined',
                'voided': 'voided'
            }
            
            if new_docusign_status in status_mapping:
                agreement.status = status_mapping[new_docusign_status]
                
                if old_status != agreement.status:
                    logger.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement status changed", {
                        "agreement_id": agreement.id,
                        "old_status": old_status,
                        "new_status": agreement.status,
                        "docusign_status": new_docusign_status
                    })
        
        # Update timestamps
        if envelope_data.get('sentDateTime') and not agreement.sent_at:
            try:
                agreement.sent_at = datetime.fromisoformat(
                    envelope_data['sentDateTime'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError) as e:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Failed to parse envelope sentDateTime", {
                    "agreement_id": agreement.id,
                    "sentDateTime": envelope_data.get('sentDateTime'),
                    "error": str(e)
                })
        
        if envelope_data.get('completedDateTime') and not agreement.completed_at:
            try:
                agreement.completed_at = datetime.fromisoformat(
                    envelope_data['completedDateTime'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError) as e:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Failed to parse envelope completedDateTime", {
                    "agreement_id": agreement.id,
                    "completedDateTime": envelope_data.get('completedDateTime'),
                    "error": str(e)
                })
        
        if envelope_data.get('voidedDateTime') and not agreement.voided_at:
            try:
                agreement.voided_at = datetime.fromisoformat(
                    envelope_data['voidedDateTime'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError) as e:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Failed to parse envelope voidedDateTime", {
                    "agreement_id": agreement.id,
                    "voidedDateTime": envelope_data.get('voidedDateTime'),
                    "error": str(e)
                })
        
        # Process recipient status changes
        recipients = envelope_data.get('recipients', {})
        WebhookProcessor._update_participants(agreement, recipients)
        
        # Create timeline event
        event_description = WebhookProcessor._build_event_description(
            event_type,
            old_status,
            agreement.status,
            envelope_data
        )
        
        timeline_event = AgreementEvent(
            agreement_id=agreement.id,
            event_type=WebhookProcessor._map_event_type(event_type),
            description=event_description,
            actor_id=None,  # System event
            metadata=json.dumps({
                'docusign_event': event_type,
                'docusign_status': new_docusign_status
            })
        )
        
        db.session.add(timeline_event)
        
        # If completed, enqueue document fetch task
        if agreement.status == 'completed' and not agreement.signed_document_path:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Agreement completed - enqueueing document fetch", {
                "agreement_id": agreement.id
            })
            WebhookProcessor._enqueue_fetch_documents(agreement.id)
    
    @staticmethod
    def _update_participants(agreement: Agreement, recipients: Dict[str, Any]):
        """Update participant statuses from recipient data"""
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Updating participant statuses", {
            "agreement_id": agreement.id,
            "signer_count": len(recipients.get('signers', [])),
            "cc_count": len(recipients.get('carbonCopies', []))
        })
        
        # Process signers
        for signer in recipients.get('signers', []):
            participant = WebhookProcessor._find_participant(
                agreement,
                signer.get('recipientId'),
                signer.get('email')
            )
            
            if participant:
                WebhookProcessor._update_participant_status(participant, signer)
            else:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Participant not found for signer", {
                    "agreement_id": agreement.id,
                    "recipient_id": signer.get('recipientId'),
                    "email": signer.get('email')
                })
        
        # Process carbon copies
        for cc in recipients.get('carbonCopies', []):
            participant = WebhookProcessor._find_participant(
                agreement,
                cc.get('recipientId'),
                cc.get('email')
            )
            
            if participant:
                WebhookProcessor._update_participant_status(participant, cc)
            else:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Participant not found for CC", {
                    "agreement_id": agreement.id,
                    "recipient_id": cc.get('recipientId'),
                    "email": cc.get('email')
                })
    
    @staticmethod
    def _find_participant(
        agreement: Agreement,
        recipient_id: Optional[str],
        email: Optional[str]
    ) -> Optional[AgreementParticipant]:
        """Find participant by recipient ID or email"""
        
        for participant in agreement.participants:
            # Match by our participant ID (used as recipientId)
            if recipient_id and str(participant.id) == recipient_id:
                return participant
            
            # Match by email
            if email and participant.email == email:
                return participant
        
        return None
    
    @staticmethod
    def _update_participant_status(participant: AgreementParticipant, recipient_data: Dict[str, Any]):
        """Update participant status from recipient data"""
        
        old_status = participant.recipient_status
        status = recipient_data.get('status')
        
        if status:
            participant.recipient_status = status
            
            if old_status != status:
                logger.info(LOG_CATEGORIES["DOCUSIGN"], "Participant status changed", {
                    "participant_id": participant.id,
                    "email": participant.email,
                    "old_status": old_status,
                    "new_status": status
                })
        
        # Update timestamps
        if recipient_data.get('sentDateTime') and not participant.sent_at:
            try:
                participant.sent_at = datetime.fromisoformat(
                    recipient_data['sentDateTime'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError) as e:
                logger.warn(LOG_CATEGORIES["API"], "Failed to parse recipient sentDateTime", {
                    "participant_id": participant.id,
                    "sentDateTime": recipient_data.get('sentDateTime'),
                    "error": str(e)
                })
        
        if recipient_data.get('deliveredDateTime') and not participant.delivered_at:
            try:
                participant.delivered_at = datetime.fromisoformat(
                    recipient_data['deliveredDateTime'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError) as e:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Failed to parse recipient deliveredDateTime", {
                    "participant_id": participant.id,
                    "deliveredDateTime": recipient_data.get('deliveredDateTime'),
                    "error": str(e)
                })
        
        if recipient_data.get('signedDateTime') and not participant.signed_at:
            try:
                participant.signed_at = datetime.fromisoformat(
                    recipient_data['signedDateTime'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError) as e:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Failed to parse recipient signedDateTime", {
                    "participant_id": participant.id,
                    "signedDateTime": recipient_data.get('signedDateTime'),
                    "error": str(e)
                })
        
        if recipient_data.get('declinedDateTime') and not participant.declined_at:
            try:
                participant.declined_at = datetime.fromisoformat(
                    recipient_data['declinedDateTime'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError) as e:
                logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Failed to parse recipient declinedDateTime", {
                    "participant_id": participant.id,
                    "declinedDateTime": recipient_data.get('declinedDateTime'),
                    "error": str(e)
                })
    
    @staticmethod
    def _map_event_type(docusign_event: str) -> str:
        """Map DocuSign event type to our event type"""
        
        mapping = {
            'envelope-sent': 'sent',
            'envelope-delivered': 'delivered',
            'envelope-completed': 'completed',
            'envelope-declined': 'declined',
            'envelope-voided': 'voided',
            'recipient-sent': 'recipient_sent',
            'recipient-delivered': 'recipient_delivered',
            'recipient-signed': 'recipient_signed',
            'recipient-declined': 'recipient_declined',
        }
        
        return mapping.get(docusign_event, 'other')
    
    @staticmethod
    def _build_event_description(
        event_type: str,
        old_status: str,
        new_status: str,
        envelope_data: Dict[str, Any]
    ) -> str:
        """Build human-readable event description"""
        
        if new_status != old_status:
            status_descriptions = {
                'sent': 'Agreement sent for signature',
                'delivered': 'Agreement delivered to recipients',
                'completed': 'Agreement signed by all parties',
                'declined': 'Agreement declined',
                'voided': 'Agreement voided'
            }
            
            return status_descriptions.get(new_status, f'Agreement status changed to {new_status}')
        
        # Recipient-specific events
        if 'recipient' in event_type:
            return f'Recipient event: {event_type}'
        
        return f'DocuSign event: {event_type}'
    
    @staticmethod
    def _enqueue_fetch_documents(agreement_id: str):
        """Enqueue task to fetch completed documents"""
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Enqueueing fetch documents task", {
                "agreement_id": agreement_id
            })
            
            # Import here to avoid circular dependency
            from app.celery.tasks.docusign import fetch_completed_documents_task
            
            task = fetch_completed_documents_task.delay(agreement_id)
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Fetch documents task enqueued successfully", {
                "agreement_id": agreement_id,
                "task_id": task.id
            })
            
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Failed to enqueue fetch documents task", {
                "agreement_id": agreement_id,
                "error": str(e)
            })
