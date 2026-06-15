"""Agreement signing URL routes."""

from flask import jsonify

from app.models import AgreementParticipant
from app.schemas import GetSigningUrlRequest, GetSigningUrlResponse
from app.services.docusign import AgreementLifecycleService
from app.services.docusign.utils.permissions import can_get_signing_url
from app.utils.common_patterns import (
    forbidden,
    not_found,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.db.orm_lookup import get_model
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


def register_signing_url_routes(bp):
    @bp.route("/agreements/<agreement_id>/signing-url", methods=["POST"])
    @rate_limit(max_requests=50, window_seconds=60)
    @require_authenticated_user
    @validate_request(GetSigningUrlRequest)
    @validate_response(GetSigningUrlResponse)
    def get_signing_url(user, agreement_id, data: GetSigningUrlRequest):
        try:
            request_data = data.model_dump(mode="json")
            participant_id = request_data.get("participant_id")
            if not participant_id:
                log.warn(
                    "DOCUSIGN",
                    "Signing URL request without participant_id",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return validation(
                    "participant_id required",
                    field_errors={"participant_id": "Required"},
                )
            log.debug(
                "DOCUSIGN",
                "Generating signing URL",
                {
                    "agreement_id": agreement_id,
                    "participant_id": participant_id,
                    "user_id": user.id,
                },
            )
            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            participant = get_model(AgreementParticipant, participant_id)
            if not participant or participant.agreement_id != agreement_id:
                log.warn(
                    "DOCUSIGN",
                    "Participant not found for signing URL",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id,
                    },
                )
                return not_found("Participant not found")
            if not can_get_signing_url(user, agreement, participant):
                log.warn(
                    "DOCUSIGN",
                    "User denied access to signing URL",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id,
                    },
                )
                return forbidden()
            signing_url = AgreementLifecycleService.get_signing_url(
                agreement_id=agreement_id, participant_id=participant_id
            )
            log.info(
                "DOCUSIGN",
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
                "ERRORS",
                "Failed to get signing URL",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return server_error(
                e, context={"function": "get_signing_url", "agreement_id": agreement_id}
            )

    @bp.route("/agreements/<agreement_id>/sender-view", methods=["GET"])
    @rate_limit(max_requests=50, window_seconds=60)
    @require_authenticated_user
    def get_sender_view_url(user, agreement_id):
        try:
            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if user.id != agreement.agent_id:
                log.warn(
                    "DOCUSIGN",
                    "User denied access to sender view",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return forbidden()

            sender_url = AgreementLifecycleService.get_sender_view_url(agreement_id=agreement_id)
            return jsonify({"success": True, "sender_url": sender_url}), 200
        except Exception as e:
            log.error(
                "ERRORS",
                "Failed to get sender view URL",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return server_error(
                e, context={"function": "get_sender_view_url", "agreement_id": agreement_id}
            )
