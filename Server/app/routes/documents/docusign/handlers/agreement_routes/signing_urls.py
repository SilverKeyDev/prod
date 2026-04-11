"""Agreement signing URL routes."""

from flask import jsonify, request

from app.models import AgreementParticipant
from app.schemas import GetSigningUrlRequest, GetSigningUrlResponse
from app.services.auth import get_current_user
from app.services.docusign import AgreementLifecycleService
from app.services.docusign.utils.permissions import can_get_signing_url
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


def register_signing_url_routes(bp):
    @bp.route("/agreements/<agreement_id>/signing-url", methods=["POST"])
    @rate_limit(max_requests=50, window_seconds=60)
    @validate_request(GetSigningUrlRequest)
    @validate_response(GetSigningUrlResponse)
    def get_signing_url(agreement_id, data: GetSigningUrlRequest | None = None):
        try:
            user = get_current_user()
            if not user:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Unauthenticated signing URL request",
                    {"agreement_id": agreement_id},
                )
                return jsonify({"success": False, "error": "Authentication required"}), 401
            if data is None:
                request_data = request.get_json(silent=True) or {}
            else:
                request_data = data.model_dump(mode="json")
            participant_id = request_data.get("participant_id")
            if not participant_id:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Signing URL request without participant_id",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "participant_id required"}), 400
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Generating signing URL",
                {
                    "agreement_id": agreement_id,
                    "participant_id": participant_id,
                    "user_id": user.id,
                },
            )
            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            participant = AgreementParticipant.query.get(participant_id)
            if not participant or participant.agreement_id != agreement_id:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Participant not found for signing URL",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id,
                    },
                )
                return jsonify({"success": False, "error": "Participant not found"}), 404
            if not can_get_signing_url(user, agreement, participant):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "User denied access to signing URL",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id,
                    },
                )
                return jsonify({"success": False, "error": "Access denied"}), 403
            signing_url = AgreementLifecycleService.get_signing_url(
                agreement_id=agreement_id, participant_id=participant_id
            )
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Signing URL generated successfully",
                {
                    "agreement_id": agreement_id,
                    "participant_id": participant_id,
                    "user_id": user.id,
                    "participant_email": participant.email,
                },
            )
            return jsonify({"success": True, "signing_url": signing_url}), 200
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to get signing URL",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return SecureErrorHandler.handle_error(e, "Failed to get signing URL")

    @bp.route("/agreements/<agreement_id>/sender-view", methods=["GET"])
    @rate_limit(max_requests=50, window_seconds=60)
    def get_sender_view_url(agreement_id):
        try:
            user = get_current_user()
            if not user:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Unauthenticated sender view request",
                    {"agreement_id": agreement_id},
                )
                return jsonify({"success": False, "error": "Authentication required"}), 401

            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if user.id != agreement.agent_id:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "User denied access to sender view",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "Access denied"}), 403

            sender_url = AgreementLifecycleService.get_sender_view_url(agreement_id=agreement_id)
            return jsonify({"success": True, "sender_url": sender_url}), 200
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to get sender view URL",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return SecureErrorHandler.handle_error(e, "Failed to get sender view URL")
