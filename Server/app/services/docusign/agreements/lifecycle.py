"""
Agreement lifecycle service

High-level agreement operations.
"""

import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app import db
from app.models import Agreement, AgreementParticipant, AgreementEvent, AgreementRevision
from logger import get_logger, LOG_CATEGORIES
from ..errors import AgreementNotFoundError, AgreementStateError
from ..envelopes.signing import SigningService

logger = get_logger()


class AgreementLifecycleService:
    """High-level agreement operations"""
    
    @staticmethod
    def create_agreement(
        agent_id: str,
        buyer_id: str,
        title: str,
        agreement_type: str,
        **kwargs
    ) -> Agreement:
        """
        Create new agreement.
        
        Args:
            agent_id: Agent user ID
            buyer_id: Buyer user ID
            title: Agreement title
            agreement_type: Type (e.g., 'offer', 'inspection')
            **kwargs: Additional fields
            
        Returns:
            Created Agreement
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating agreement", {
            "agent_id": agent_id,
            "buyer_id": buyer_id,
            "title": title,
            "agreement_type": agreement_type,
            "property_address": kwargs.get('property_address')
        })
        
        agreement = Agreement(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            buyer_id=buyer_id,
            title=title,
            agreement_type=agreement_type,
            status='draft',
            description=kwargs.get('description'),
            property_address=kwargs.get('property_address')
        )
        
        db.session.add(agreement)
        
        # Create initial event
        event = AgreementEvent(
            agreement_id=agreement.id,
            event_type='created',
            description='Agreement created',
            actor_id=agent_id
        )
        db.session.add(event)
        
        db.session.commit()
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement created successfully", {
            "agreement_id": agreement.id,
            "agent_id": agent_id,
            "buyer_id": buyer_id,
            "agreement_type": agreement_type
        })
        
        return agreement
    
    @staticmethod
    def get_agreement(agreement_id: str) -> Agreement:
        """Get agreement by ID"""
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Fetching agreement", {
            "agreement_id": agreement_id
        })
        
        agreement = Agreement.query.get(agreement_id)
        if not agreement:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Agreement not found", {
                "agreement_id": agreement_id
            })
            raise AgreementNotFoundError(f"Agreement {agreement_id} not found")
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Agreement fetched successfully", {
            "agreement_id": agreement_id,
            "status": agreement.status
        })
        
        return agreement
    
    @staticmethod
    def send_for_signature(agreement_id: str, signing_method: str, actor_id: str):
        """
        Enqueue task to send agreement for signature.
        
        Args:
            agreement_id: Agreement ID
            signing_method: 'embedded' or 'email'
            actor_id: User initiating send
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Preparing to send agreement for signature", {
            "agreement_id": agreement_id,
            "signing_method": signing_method,
            "actor_id": actor_id
        })
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        
        # Validate can send
        if agreement.status != 'draft':
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Cannot send agreement - invalid status", {
                "agreement_id": agreement_id,
                "current_status": agreement.status
            })
            raise AgreementStateError(f"Cannot send agreement with status: {agreement.status}")
        
        if not agreement.current_revision_id:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Cannot send agreement - no revision", {
                "agreement_id": agreement_id
            })
            raise AgreementStateError("Agreement has no current revision")
        
        if not agreement.participants:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Cannot send agreement - no participants", {
                "agreement_id": agreement_id
            })
            raise AgreementStateError("Agreement has no participants")
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Enqueueing send agreement task", {
            "agreement_id": agreement_id,
            "signing_method": signing_method,
            "participant_count": len(agreement.participants),
            "revision_id": agreement.current_revision_id
        })
        
        # Import here to avoid circular dependency
        from app.celery.tasks.docusign import send_envelope_task
        task = send_envelope_task.delay(agreement_id, signing_method, actor_id)
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Send agreement task enqueued successfully", {
            "agreement_id": agreement_id,
            "task_id": task.id
        })
        
        return task.id
    
    @staticmethod
    def void_agreement(agreement_id: str, reason: str, actor_id: str):
        """
        Void an agreement.
        
        Args:
            agreement_id: Agreement ID
            reason: Void reason
            actor_id: User voiding
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Voiding agreement", {
            "agreement_id": agreement_id,
            "reason": reason,
            "actor_id": actor_id
        })
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        
        if agreement.status in ['completed', 'voided']:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Cannot void agreement - invalid status", {
                "agreement_id": agreement_id,
                "current_status": agreement.status
            })
            raise AgreementStateError(f"Cannot void agreement with status: {agreement.status}")
        
        has_envelope = bool(agreement.docusign_envelope_id)
        
        if not agreement.docusign_envelope_id:
            # Just mark as voided locally
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Voiding agreement locally (no envelope)", {
                "agreement_id": agreement_id
            })
            agreement.status = 'voided'
            agreement.voided_at = datetime.now(timezone.utc)
        else:
            # Void in DocuSign
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Voiding agreement in DocuSign", {
                "agreement_id": agreement_id,
                "envelope_id": agreement.docusign_envelope_id
            })
            from ..core.client import DocusignClient
            client = DocusignClient(auth_type='jwt')
            client.void_envelope(agreement.docusign_envelope_id, reason)
            
            agreement.status = 'voided'
            agreement.voided_at = datetime.now(timezone.utc)
        
        # Create event
        event = AgreementEvent(
            agreement_id=agreement_id,
            event_type='voided',
            description=f'Agreement voided: {reason}',
            actor_id=actor_id
        )
        db.session.add(event)
        
        db.session.commit()
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement voided successfully", {
            "agreement_id": agreement_id,
            "had_envelope": has_envelope,
            "reason": reason
        })
    
    @staticmethod
    def get_signing_url(agreement_id: str, participant_id: str) -> str:
        """
        Get embedded signing URL for participant.
        
        Args:
            agreement_id: Agreement ID
            participant_id: Participant ID
            
        Returns:
            Signing URL
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Getting signing URL", {
            "agreement_id": agreement_id,
            "participant_id": participant_id
        })
        
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        
        participant = AgreementParticipant.query.get(participant_id)
        if not participant or participant.agreement_id != agreement_id:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Participant not found for signing URL", {
                "agreement_id": agreement_id,
                "participant_id": participant_id
            })
            from ..errors import ParticipantNotFoundError
            raise ParticipantNotFoundError(f"Participant {participant_id} not found")
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Generating signing URL via SigningService", {
            "agreement_id": agreement_id,
            "participant_id": participant_id,
            "participant_email": participant.email
        })
        
        signing_url = SigningService.get_signing_url(agreement, participant)
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Signing URL generated successfully", {
            "agreement_id": agreement_id,
            "participant_id": participant_id
        })
        
        return signing_url
