"""Agreement document download routes."""

from flask import jsonify
from sqlalchemy import select

from app import db
from app.models import Agreement
from app.schemas import DocusignAgreementDownloadUrlResponse
from app.services.documents.s3_service import S3Service
from app.services.docusign.utils.permissions import can_access_agreement
from app.utils.common_patterns import forbidden, not_found, require_authenticated_user, server_error
from app.utils.security import rate_limit
from app.utils.validation import validate_response
from logger import log


def register_download_routes(bp):
    @bp.route("/agreements/<agreement_id>/download", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignAgreementDownloadUrlResponse)
    def get_download_url(user, agreement_id):
        """
        Get a pre-signed S3 URL for viewing or downloading the agreement PDF.

        Prefers the merged signed document when present; otherwise falls back to the
        latest revision file (e.g. sent but not yet completed, or signing UI unavailable).

        Returns:
            200: { success: true, download_url: str, expires_at: str }
            401: Authentication required
            403: Access denied
            404: Agreement not found or no document file available
            500: Server error
        """
        try:
            log.debug(
                "DOCUSIGN",
                "Fetching download URL for agreement",
                {"agreement_id": agreement_id, "user_id": user.id},
            )

            # Get agreement
            agreement = db.session.scalar(select(Agreement).where(Agreement.id == agreement_id))
            if not agreement:
                log.warn(
                    "DOCUSIGN",
                    "Agreement not found for download",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return not_found("Agreement not found")

            # Check access
            if not can_access_agreement(user, agreement):
                log.warn(
                    "DOCUSIGN",
                    "User denied access to download agreement",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return forbidden()

            document_path = agreement.signed_document_path
            if not document_path:
                current_revision = agreement.current_revision
                if current_revision and current_revision.file_path:
                    document_path = current_revision.file_path

            if not document_path:
                log.warn(
                    "DOCUSIGN",
                    "No agreement document available for download",
                    {
                        "agreement_id": agreement_id,
                        "user_id": user.id,
                        "status": agreement.status,
                    },
                )
                return not_found("Document not yet available")

            # Pre-signed TTL comes from S3_PRESIGNED_URL_EXPIRATION / config (default 1 hour).
            s3_service = S3Service()
            download_url = s3_service.generate_presigned_url(document_path)

            log.info(
                "DOCUSIGN",
                "Download URL generated successfully",
                {
                    "agreement_id": agreement_id,
                    "user_id": user.id,
                    "document_path": document_path,
                    "used_signed_document": bool(agreement.signed_document_path),
                },
            )

            return (
                jsonify(
                    {
                        "success": True,
                        "download_url": download_url,
                        "expires_at": None,  # Can add expiration timestamp if needed
                    }
                ),
                200,
            )

        except Exception as e:
            log.error(
                "ERRORS",
                "Failed to generate download URL",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return server_error(
                e, context={"function": "get_download_url", "agreement_id": agreement_id}
            )
