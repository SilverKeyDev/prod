"""
DocuSign envelope builder

Construct envelope definitions from agreements.
"""

from typing import Dict, Any
import base64

from docusign_esign import EnvelopeDefinition, Document, Recipients
from app.models import Agreement
from app.services.documents.s3_service import s3_service
from logger import get_logger, LOG_CATEGORIES
from ..utils.recipients import build_recipients_from_participants, validate_participants
from ..errors import AgreementStateError

logger = get_logger()


class EnvelopeBuilder:
    """Build DocuSign envelope from Agreement"""
    
    def __init__(self, agreement: Agreement, signing_method: str = 'embedded'):
        """
        Initialize envelope builder.
        
        Args:
            agreement: Agreement model
            signing_method: 'embedded' or 'email'
        """
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Initializing envelope builder", {
            "agreement_id": agreement.id,
            "signing_method": signing_method
        })
        
        self.agreement = agreement
        self.signing_method = signing_method
        
        # Validate agreement state
        self._validate()
    
    def _validate(self):
        """Validate agreement can be sent"""
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Validating agreement for envelope building", {
            "agreement_id": self.agreement.id,
            "has_revision": bool(self.agreement.current_revision),
            "participant_count": len(self.agreement.participants) if self.agreement.participants else 0
        })
        
        if not self.agreement.current_revision:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Agreement validation failed - no revision", {
                "agreement_id": self.agreement.id
            })
            raise AgreementStateError("Agreement has no current revision")
        
        if not self.agreement.participants:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Agreement validation failed - no participants", {
                "agreement_id": self.agreement.id
            })
            raise AgreementStateError("Agreement has no participants")
        
        # Validate participants
        is_valid, error = validate_participants(self.agreement.participants)
        if not is_valid:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Agreement validation failed - invalid participants", {
                "agreement_id": self.agreement.id,
                "error": error
            })
            raise AgreementStateError(error)
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Agreement validation successful", {
            "agreement_id": self.agreement.id
        })
    
    def build(self) -> EnvelopeDefinition:
        """Build envelope definition"""
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Building envelope definition", {
            "agreement_id": self.agreement.id,
            "signing_method": self.signing_method,
            "email_subject": self.agreement.title
        })
        
        # Build document
        document = self._build_document()
        
        # Build recipients
        recipients = self._build_recipients()
        
        # Build envelope
        envelope = EnvelopeDefinition(
            email_subject=self.agreement.title,
            documents=[document],
            recipients=recipients,
            status='sent'  # Send immediately
        )
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Envelope definition built successfully", {
            "agreement_id": self.agreement.id,
            "signing_method": self.signing_method
        })
        
        return envelope
    
    def _build_document(self) -> Document:
        """Build document from current revision"""
        revision = self.agreement.current_revision
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Building document from revision", {
            "agreement_id": self.agreement.id,
            "revision_id": revision.id,
            "filename": revision.filename,
            "file_path": revision.file_path
        })
        
        # Fetch document from S3
        try:
            file_bytes = s3_service.get_pdf(revision.file_path)
            if not file_bytes:
                logger.error(LOG_CATEGORIES["ERRORS"], "Failed to fetch document from S3 - empty response", {
                    "agreement_id": self.agreement.id,
                    "file_path": revision.file_path
                })
                raise AgreementStateError("Failed to fetch document from S3")
            
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Document fetched from S3", {
                "agreement_id": self.agreement.id,
                "size_bytes": len(file_bytes),
                "size_kb": len(file_bytes) / 1024
            })
        except Exception as e:
            logger.error(LOG_CATEGORIES["ERRORS"], "Failed to fetch document from S3", {
                "agreement_id": self.agreement.id,
                "file_path": revision.file_path,
                "error": str(e)
            })
            raise AgreementStateError(f"Failed to fetch document: {str(e)}")
        
        # Encode to base64
        doc_base64 = base64.b64encode(file_bytes).decode('utf-8')
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Document encoded to base64", {
            "agreement_id": self.agreement.id,
            "base64_length": len(doc_base64)
        })
        
        document = Document(
            document_base64=doc_base64,
            name=revision.filename,
            file_extension=revision.mime_type.split('/')[-1],
            document_id='1'
        )
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Document built successfully", {
            "agreement_id": self.agreement.id,
            "filename": revision.filename
        })
        
        return document
    
    def _build_recipients(self) -> Recipients:
        """Build recipients from participants"""
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Building recipients from participants", {
            "agreement_id": self.agreement.id,
            "participant_count": len(self.agreement.participants),
            "signing_method": self.signing_method
        })
        
        recipients_dict = build_recipients_from_participants(self.agreement.participants)
        
        # If embedded signing, set clientUserId for signers
        if self.signing_method == 'embedded' and 'signers' in recipients_dict:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Setting clientUserId for embedded signing", {
                "agreement_id": self.agreement.id,
                "signer_count": len(recipients_dict['signers'])
            })
            for signer in recipients_dict['signers']:
                signer['clientUserId'] = signer['recipientId']
        
        recipients = Recipients(**recipients_dict)
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Recipients built successfully", {
            "agreement_id": self.agreement.id,
            "signer_count": len(recipients_dict.get('signers', [])),
            "cc_count": len(recipients_dict.get('carbon_copies', []))
        })
        
        return recipients
