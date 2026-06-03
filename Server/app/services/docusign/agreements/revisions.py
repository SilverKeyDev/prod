"""
Agreement revision management
"""

import io
import uuid

from sqlalchemy import func, select

from app import db
from app.models import Agreement, AgreementEvent, AgreementRevision
from app.services.documents.s3_service import s3_service
from app.utils.db.orm_lookup import get_model
from logger import log

from ..errors import InvalidRevisionFileError
from ..utils.idempotency import generate_file_hash

_PYPDF_WARNED_MISSING = False


def _assert_readable_pdf(file_content: bytes) -> None:
    """Reject corrupt or non-PDF uploads before S3/DocuSign."""
    global _PYPDF_WARNED_MISSING

    if not file_content:
        raise InvalidRevisionFileError("Uploaded file is empty")
    if not file_content.startswith(b"%PDF-"):
        raise InvalidRevisionFileError("Uploaded file is not a valid PDF")

    try:
        from pypdf import PdfReader
    except ImportError:
        if not _PYPDF_WARNED_MISSING:
            _PYPDF_WARNED_MISSING = True
            log.warn(
                "DOCUSIGN",
                "pypdf not installed; only PDF magic-byte check runs. "
                "Install dependencies (pip install -r requirements/runtime.txt) for full validation.",
                {},
            )
        return

    try:
        reader = PdfReader(io.BytesIO(file_content), strict=False)
        if len(reader.pages) < 1:
            raise InvalidRevisionFileError("Uploaded file is not a valid PDF")
    except InvalidRevisionFileError:
        raise
    except Exception as e:
        log.warn(
            "DOCUSIGN",
            "Revision upload failed PDF validation",
            {"error": str(e)},
        )
        raise InvalidRevisionFileError("Uploaded file is not a valid PDF") from e


class RevisionService:
    """Manage agreement revisions"""

    @staticmethod
    def create_revision(
        agreement_id: str,
        file_content: bytes,
        filename: str,
        created_by: str,
        notes: str | None = None,
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

        log.debug(
            "DOCUSIGN",
            "Creating agreement revision",
            {
                "agreement_id": agreement_id,
                "filename": filename,
                "file_size": len(file_content),
                "created_by": created_by,
                "has_notes": bool(notes),
            },
        )

        agreement = get_model(Agreement, agreement_id)
        if not agreement:
            log.warn(
                "DOCUSIGN",
                "Agreement not found for revision",
                {"agreement_id": agreement_id},
            )
            raise AgreementNotFoundError(f"Agreement {agreement_id} not found")

        _assert_readable_pdf(file_content)

        # Calculate version number
        existing_revisions = (
            db.session.scalar(
                select(func.count())
                .select_from(AgreementRevision)
                .where(AgreementRevision.agreement_id == agreement_id)
            )
            or 0
        )
        version_number = existing_revisions + 1

        log.debug(
            "DOCUSIGN",
            "Calculated revision version",
            {
                "agreement_id": agreement_id,
                "version_number": version_number,
                "existing_revisions": existing_revisions,
            },
        )

        # Generate file hash
        file_hash = generate_file_hash(file_content)

        log.debug(
            "DOCUSIGN",
            "Generated file hash",
            {"agreement_id": agreement_id, "file_hash": file_hash[:16] + "..."},
        )

        # Upload to S3
        s3_key = f"agreements/{agreement_id}/revisions/{version_number}/{filename}"

        log.debug(
            "DOCUSIGN",
            "Uploading revision to S3",
            {
                "agreement_id": agreement_id,
                "s3_key": s3_key,
                "file_size_kb": len(file_content) / 1024,
            },
        )

        uploaded_key = s3_service.upload_pdf(file_content, s3_key, content_type="application/pdf")
        if not uploaded_key:
            log.error(
                "ERRORS",
                "Failed to upload revision to S3",
                {"agreement_id": agreement_id, "s3_key": s3_key},
            )
            raise Exception("Failed to upload document to S3")

        log.debug(
            "DOCUSIGN",
            "Revision uploaded to S3 successfully",
            {"agreement_id": agreement_id, "uploaded_key": uploaded_key},
        )

        # Create revision
        revision = AgreementRevision(
            id=str(uuid.uuid4()),
            agreement_id=agreement_id,
            version_number=version_number,
            file_path=s3_key,
            filename=filename,
            file_size=len(file_content),
            file_hash=file_hash,
            mime_type="application/pdf",
            created_by=created_by,
            notes=notes,
        )

        db.session.add(revision)

        # Current revision is derived from latest by version_number (no reverse FK)

        # Create event
        event = AgreementEvent(
            agreement_id=agreement_id,
            event_type="revision_created",
            description=f"Revision {version_number} created",
            actor_id=created_by,
        )
        db.session.add(event)

        db.session.commit()

        log.info(
            "DOCUSIGN",
            "Agreement revision created successfully",
            {
                "agreement_id": agreement_id,
                "revision_id": revision.id,
                "version_number": version_number,
                "filename": filename,
                "file_size_kb": len(file_content) / 1024,
                "created_by": created_by,
            },
        )

        return revision
