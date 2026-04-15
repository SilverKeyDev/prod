"""Agreement document download routes."""

from flask import jsonify

from app.models import Agreement
from app.services.auth import get_current_user
from app.services.documents.s3_service import S3Service
from app.services.docusign.utils.permissions import can_access_agreement
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


def register_download_routes(bp):
    @bp.route("/agreements/<agreement_id>/download", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    def get_download_url(agreement_id):
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
            user = get_current_user()
            if not user:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Unauthenticated download attempt",
                    {"agreement_id": agreement_id},
                )
                return jsonify({"success": False, "error": "Authentication required"}), 401

            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Fetching download URL for agreement",
                {"agreement_id": agreement_id, "user_id": user.id},
            )

            # Get agreement
            agreement = Agreement.query.filter_by(id=agreement_id).first()
            if not agreement:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Agreement not found for download",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "Agreement not found"}), 404

            # Check access
            if not can_access_agreement(user, agreement):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "User denied access to download agreement",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "Access denied"}), 403

            document_path = agreement.signed_document_path
            if not document_path:
                current_revision = agreement.current_revision
                if current_revision and current_revision.file_path:
                    document_path = current_revision.file_path

            if not document_path:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "No agreement document available for download",
                    {
                        "agreement_id": agreement_id,
                        "user_id": user.id,
                        "status": agreement.status,
                    },
                )
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Document not yet available",
                        }
                    ),
                    404,
                )

            # Generate pre-signed URL (valid for 1 hour)
            s3_service = S3Service()
            download_url = s3_service.generate_presigned_url(
                document_path,
                expiration=3600,  # 1 hour
            )

            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
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
                LOG_CATEGORIES["ERRORS"],
                "Failed to generate download URL",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return SecureErrorHandler.handle_error(e, "Failed to generate download URL")
