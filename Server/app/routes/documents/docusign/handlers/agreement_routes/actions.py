"""Agreement action routes: revision, send, void."""

from app.schemas import (
    DocusignResendRecipientRequest,
    DocusignResendRecipientResponse,
    DocusignUpdateEnvelopeNotificationRequest,
    DocusignUpdateEnvelopeNotificationResponse,
    SendAgreementRequest,
    SendAgreementResponse,
    VoidAgreementRequest,
    VoidAgreementResponse,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response

from ..agreement_actions import (
    create_revision_action,
    discard_agreement_action,
    resend_agreement_recipient_action,
    send_agreement_action,
    update_agreement_envelope_notification_action,
    void_agreement_action,
)


def register_action_routes(bp):
    @bp.route("/agreements/<agreement_id>/revisions", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    def create_revision(agreement_id):
        return create_revision_action(agreement_id)

    @bp.route("/agreements/<agreement_id>/send", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    @validate_request(SendAgreementRequest)
    @validate_response(SendAgreementResponse)
    def send_agreement(agreement_id, data: SendAgreementRequest | None = None):
        return send_agreement_action(agreement_id, data=data)

    @bp.route("/agreements/<agreement_id>/void", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    @validate_request(VoidAgreementRequest)
    @validate_response(VoidAgreementResponse)
    def void_agreement(agreement_id, data: VoidAgreementRequest | None = None):
        return void_agreement_action(agreement_id, data=data)

    @bp.route("/agreements/<agreement_id>/discard", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    @validate_request(VoidAgreementRequest)
    @validate_response(VoidAgreementResponse)
    def discard_agreement(agreement_id, data: VoidAgreementRequest | None = None):
        return discard_agreement_action(agreement_id, data=data)

    @bp.route("/agreements/<agreement_id>/resend", methods=["POST"])
    @rate_limit(max_requests=30, window_seconds=60)
    @validate_request(DocusignResendRecipientRequest)
    @validate_response(DocusignResendRecipientResponse)
    def resend_agreement_recipient(
        agreement_id, data: DocusignResendRecipientRequest | None = None
    ):
        return resend_agreement_recipient_action(agreement_id, data=data)

    @bp.route("/agreements/<agreement_id>/notification", methods=["PUT"])
    @rate_limit(max_requests=30, window_seconds=60)
    @validate_request(DocusignUpdateEnvelopeNotificationRequest)
    @validate_response(DocusignUpdateEnvelopeNotificationResponse)
    def update_agreement_notification(
        agreement_id, data: DocusignUpdateEnvelopeNotificationRequest | None = None
    ):
        return update_agreement_envelope_notification_action(agreement_id, data=data)
