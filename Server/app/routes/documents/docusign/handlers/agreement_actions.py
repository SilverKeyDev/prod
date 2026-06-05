"""DocuSign agreement action handlers (revision, send, void, etc.)."""

from flask import jsonify, request

from app.dtos.documents import revision_payload
from app.schemas import (
    DocusignResendRecipientRequest,
    DocusignResendRecipientResponse,
    DocusignUpdateEnvelopeNotificationRequest,
    DocusignUpdateEnvelopeNotificationResponse,
    SendAgreementRequest,
    VoidAgreementRequest,
)
from app.services.docusign import AgreementLifecycleService, RevisionService
from app.services.docusign.envelopes.recipient_delivery import (
    resend_agreement_recipient,
    update_agreement_envelope_notification,
)
from app.services.docusign.errors import DocusignError
from app.services.docusign.utils.permissions import (
    can_discard_agreement_as_agent,
    can_manage_in_flight_docusign_envelope,
    can_modify_agreement,
    can_send_agreement,
    can_void_agreement,
)
from app.utils.common_patterns import (
    forbidden,
    server_error,
    validation,
)
from logger import log


def _envelope_options_from_send_payload(payload: dict) -> dict | None:
    keys = ("envelope_notification", "tab_prefill", "envelope_prefill_tabs", "template_role_map")
    out = {k: payload[k] for k in keys if k in payload and payload[k] is not None}
    return out or None


def create_revision_action(user, agreement_id):
    """Handle POST /agreements/<id>/revisions."""
    try:
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_modify_agreement(user, agreement):
            log.warn(
                "DOCUSIGN",
                "User denied access to modify agreement",
                {"agreement_id": agreement_id, "user_id": user.id},
            )
            return forbidden()
        if "file" not in request.files:
            log.warn(
                "DOCUSIGN",
                "Revision creation without file",
                {"agreement_id": agreement_id, "user_id": user.id},
            )
            return validation("No file provided", field_errors={"file": "Required"})
        file = request.files["file"]
        raw_name = file.filename if isinstance(file.filename, str) else ""
        filename = raw_name.strip()
        # Browsers send multipart filename "blob" when FormData omits the third argument
        if not filename or filename.lower() == "blob":
            filename = "agreement.pdf"
        file_content = file.read()
        log.debug(
            "DOCUSIGN",
            "Creating agreement revision",
            {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "filename": filename,
                "file_size": len(file_content),
            },
        )
        revision = RevisionService.create_revision(
            agreement_id=agreement_id,
            file_content=file_content,
            filename=filename,
            created_by=user.id,
            notes=request.form.get("notes"),
        )
        log.info(
            "DOCUSIGN",
            "Agreement revision created successfully",
            {
                "agreement_id": agreement_id,
                "revision_id": revision.id,
                "user_id": user.id,
                "filename": filename,
            },
        )
        return jsonify({"success": True, "revision": revision_payload(revision)}), 200
    except DocusignError:
        # Let Flask error handlers deal with DocuSign-specific errors
        raise
    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to create revision",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return server_error(
            e, context={"function": "create_revision", "agreement_id": agreement_id}
        )


def send_agreement_action(user, agreement_id, data: SendAgreementRequest):
    """Handle POST /agreements/<id>/send."""
    try:
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_send_agreement(user, agreement):
            log.warn(
                "DOCUSIGN",
                "User denied access to send agreement",
                {
                    "agreement_id": agreement_id,
                    "user_id": user.id,
                    "agreement_status": agreement.status,
                },
            )
            return forbidden()
        request_data = data.model_dump(mode="json", exclude_none=True)
        signing_method = request_data.get("signing_method", "embedded")
        participant_user_id = request_data.get("participant_user_id")
        envelope_options = _envelope_options_from_send_payload(request_data)
        log.debug(
            "DOCUSIGN",
            "Sending agreement for signature",
            {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "signing_method": signing_method,
                "participant_user_id": participant_user_id,
                "agreement_status": agreement.status,
            },
        )
        task_id = AgreementLifecycleService.send_for_signature(
            agreement_id=agreement_id,
            signing_method=signing_method,
            actor_id=user.id,
            participant_user_id=participant_user_id,
            envelope_options=envelope_options,
        )
        log.info(
            "DOCUSIGN",
            "Agreement send task enqueued",
            {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "task_id": task_id,
                "signing_method": signing_method,
            },
        )
        return jsonify(
            {"success": True, "task_id": task_id, "message": "Agreement is being sent"}
        ), 202
    except DocusignError:
        # Let Flask error handlers deal with DocuSign-specific errors
        raise
    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to send agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return server_error(e, context={"function": "send_agreement", "agreement_id": agreement_id})


def void_agreement_action(user, agreement_id, data: VoidAgreementRequest):
    """Handle POST /agreements/<id>/void."""
    try:
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_void_agreement(user, agreement):
            log.warn(
                "DOCUSIGN",
                "User denied access to void agreement",
                {
                    "agreement_id": agreement_id,
                    "user_id": user.id,
                    "agreement_status": agreement.status,
                },
            )
            return forbidden()
        request_data = data.model_dump(mode="json")
        reason = request_data.get("reason", "Voided by agent")
        log.debug(
            "DOCUSIGN",
            "Voiding agreement",
            {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "reason": reason,
                "current_status": agreement.status,
            },
        )
        AgreementLifecycleService.void_agreement(
            agreement_id=agreement_id, reason=reason, actor_id=user.id
        )
        log.info(
            "DOCUSIGN",
            "Agreement voided successfully",
            {"agreement_id": agreement_id, "user_id": user.id, "reason": reason},
        )
        return jsonify({"success": True}), 200
    except DocusignError:
        # Let Flask error handlers deal with DocuSign-specific errors
        raise
    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to void agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return server_error(e, context={"function": "void_agreement", "agreement_id": agreement_id})


def discard_agreement_action(user, agreement_id, data: VoidAgreementRequest):
    """Handle POST /agreements/<id>/discard — agent removes from Saved (void when possible)."""
    try:
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_discard_agreement_as_agent(user, agreement):
            log.warn(
                "DOCUSIGN",
                "User denied access to discard agreement",
                {
                    "agreement_id": agreement_id,
                    "user_id": user.id,
                    "agreement_status": agreement.status,
                },
            )
            return forbidden()
        request_data = data.model_dump(mode="json")
        reason = request_data.get("reason", "Discarded by agent")
        log.debug(
            "DOCUSIGN",
            "Discarding agreement as agent",
            {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "reason": reason,
                "current_status": agreement.status,
            },
        )
        AgreementLifecycleService.discard_agreement_as_agent(
            agreement_id=agreement_id, reason=reason, actor_id=user.id
        )
        log.info(
            "DOCUSIGN",
            "Agreement discarded successfully",
            {"agreement_id": agreement_id, "user_id": user.id, "reason": reason},
        )
        return jsonify({"success": True}), 200
    except DocusignError:
        raise
    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to discard agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return server_error(
            e, context={"function": "discard_agreement", "agreement_id": agreement_id}
        )


def resend_agreement_recipient_action(
    user, agreement_id: str, data: DocusignResendRecipientRequest
):
    """POST /agreements/<id>/resend — DocuSign resend to a pending signer."""
    try:
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_manage_in_flight_docusign_envelope(user, agreement):
            return forbidden()
        detail = resend_agreement_recipient(agreement_id, data.participant_id, data.note)
        payload = DocusignResendRecipientResponse(success=True, detail=detail)
        return jsonify(payload.model_dump(mode="json")), 200
    except DocusignError:
        raise
    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to resend DocuSign recipient",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return server_error(
            e, context={"function": "resend_agreement_recipient", "agreement_id": agreement_id}
        )


def update_agreement_envelope_notification_action(
    user, agreement_id: str, data: DocusignUpdateEnvelopeNotificationRequest
):
    """PUT /agreements/<id>/notification — update DocuSign reminder/expiration settings."""
    try:
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_manage_in_flight_docusign_envelope(user, agreement):
            return forbidden()
        notification = update_agreement_envelope_notification(agreement_id, data)
        payload = DocusignUpdateEnvelopeNotificationResponse(
            success=True, notification=notification
        )
        return jsonify(payload.model_dump(mode="json")), 200
    except DocusignError:
        raise
    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to update DocuSign notification settings",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return server_error(
            e,
            context={
                "function": "update_agreement_envelope_notification",
                "agreement_id": agreement_id,
            },
        )
