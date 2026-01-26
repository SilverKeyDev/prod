"""
Agreement revision management
"""

import uuid
from datetime import datetime

from app import db
from app.models import Agreement, AgreementRevision, AgreementEvent
from app.services.documents.s3_service import s3_service
from logger import get_logger, LOG_CATEGORIES
from ..utils.idempotency import generate_file_hash

logger = get_logger()


class RevisionService:
    """Manage agreement revisions"""
    
    @staticmethod
    def create_revision(
        agreement_id: str,
        file_content: bytes,
        filename: str,
        created_by: str,
        notes: str = None
    ) -> AgreementRevision:
        """
        Create new revision for agreement.
        
        Args:
            agreement_id: Agreement ID
            file_content: File bytes
            filename: Filename
            created_by: User ID
            notes: Optional notes
            
        Returns:
            Created AgreementRevision
        """
        from ..errors import AgreementNotFoundError
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating agreement revision", {
            "agreement_id": agreement_id,
            "filename": filename,
            "file_size": len(file_content),
            "created_by": created_by,
            "has_notes": bool(notes)
        })
        
        agreement = Agreement.query.get(agreement_id)
        if not agreement:
            logger.warn(LOG_CATEGORIES["DOCUSIGN"], "Agreement not found for revision", {
                "agreement_id": agreement_id
            })
            raise AgreementNotFoundError(f"Agreement {agreement_id} not found")
        
        # Calculate version number
        existing_revisions = AgreementRevision.query.filter_by(
            agreement_id=agreement_id
        ).count()
        version_number = existing_revisions + 1
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Calculated revision version", {
            "agreement_id": agreement_id,
            "version_number": version_number,
            "existing_revisions": existing_revisions
        })
        
        # Generate file hash
        file_hash = generate_file_hash(file_content)
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Generated file hash", {
            "agreement_id": agreement_id,
            "file_hash": file_hash[:16] + "..."
        })
        
        # Upload to S3
        s3_key = f"agreements/{agreement_id}/revisions/{version_number}/{filename}"
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Uploading revision to S3", {
            "agreement_id": agreement_id,
            "s3_key": s3_key,
            "file_size_kb": len(file_content) / 1024
        })
        
        uploaded_key = s3_service.upload_pdf(file_content, s3_key, content_type='application/pdf')
        if not uploaded_key:
            logger.error(LOG_CATEGORIES["ERRORS"], "Failed to upload revision to S3", {
                "agreement_id": agreement_id,
                "s3_key": s3_key
            })
            raise Exception("Failed to upload document to S3")
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Revision uploaded to S3 successfully", {
            "agreement_id": agreement_id,
            "uploaded_key": uploaded_key
        })
        
        # Create revision
        revision = AgreementRevision(
            id=str(uuid.uuid4()),
            agreement_id=agreement_id,
            version_number=version_number,
            file_path=s3_key,
            filename=filename,
            file_size=len(file_content),
            file_hash=file_hash,
            created_by=created_by,
            notes=notes
        )
        
        db.session.add(revision)
        
        # Set as current revision
        agreement.current_revision_id = revision.id
        
        # Create event
        event = AgreementEvent(
            agreement_id=agreement_id,
            event_type='revision_created',
            description=f'Revision {version_number} created',
            actor_id=created_by
        )
        db.session.add(event)
        
        db.session.commit()
        
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Agreement revision created successfully", {
            "agreement_id": agreement_id,
            "revision_id": revision.id,
            "version_number": version_number,
            "filename": filename,
            "file_size_kb": len(file_content) / 1024,
            "created_by": created_by
        })
        
        return revision
