"""DocuSign agreement action handlers (revision, send, void, etc.)."""

from flask import jsonify, request

from app.schemas import SendAgreementRequest, VoidAgreementRequest
from app.services.auth import get_current_user
from app.services.docusign import AgreementLifecycleService, RevisionService
from app.services.docusign.errors import DocusignError
from app.services.docusign.utils.permissions import (
    can_discard_agreement_as_agent,
    can_modify_agreement,
    can_send_agreement,
    can_void_agreement,
)
from app.utils.security.secure_errors import SecureErrorHandler
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


def create_revision_action(agreement_id):
    """Handle POST /agreements/<id>/revisions."""
    try:
        user = get_current_user()
        if not user:
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Unauthenticated revision creation attempt",
                {"agreement_id": agreement_id},
            )
            return jsonify({"success": False, "error": "Authentication required"}), 401
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_modify_agreement(user, agreement):
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "User denied access to modify agreement",
                {"agreement_id": agreement_id, "user_id": user.id},
            )
            return jsonify({"success": False, "error": "Access denied"}), 403
        if "file" not in request.files:
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Revision creation without file",
                {"agreement_id": agreement_id, "user_id": user.id},
            )
            return jsonify({"success": False, "error": "No file provided"}), 400
        file = request.files["file"]
        raw_name = file.filename if isinstance(file.filename, str) else ""
        filename = raw_name.strip()
        # Browsers send multipart filename "blob" when FormData omits the third argument
        if not filename or filename.lower() == "blob":
            filename = "agreement.pdf"
        file_content = file.read()
        log.debug(
            LOG_CATEGORIES["DOCUSIGN"],
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
            LOG_CATEGORIES["DOCUSIGN"],
            "Agreement revision created successfully",
            {
                "agreement_id": agreement_id,
                "revision_id": revision.id,
                "user_id": user.id,
                "filename": filename,
            },
        )
        return jsonify({"success": True, "revision": revision.to_dict()}), 201
    except DocusignError:
        # Let Flask error handlers deal with DocuSign-specific errors
        raise
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to create revision",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return SecureErrorHandler.handle_error(e, "Failed to create revision")


def send_agreement_action(agreement_id, data: SendAgreementRequest | None = None):
    """Handle POST /agreements/<id>/send."""
    try:
        user = get_current_user()
        if not user:
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Unauthenticated send agreement attempt",
                {"agreement_id": agreement_id},
            )
            return jsonify({"error": "Authentication required"}), 401
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_send_agreement(user, agreement):
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "User denied access to send agreement",
                {
                    "agreement_id": agreement_id,
                    "user_id": user.id,
                    "agreement_status": agreement.status,
                },
            )
            return jsonify({"error": "Access denied or invalid state"}), 403
        if data is None:
            request_data = request.get_json(silent=True) or {}
        else:
            request_data = data.model_dump(mode="json")
        signing_method = request_data.get("signing_method", "embedded")
        participant_user_id = request_data.get("participant_user_id")
        log.debug(
            LOG_CATEGORIES["DOCUSIGN"],
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
        )
        log.info(
            LOG_CATEGORIES["DOCUSIGN"],
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
            LOG_CATEGORIES["ERRORS"],
            "Failed to send agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return SecureErrorHandler.handle_error(e, "Failed to send agreement")


def void_agreement_action(agreement_id, data: VoidAgreementRequest | None = None):
    """Handle POST /agreements/<id>/void."""
    try:
        user = get_current_user()
        if not user:
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Unauthenticated void agreement attempt",
                {"agreement_id": agreement_id},
            )
            return jsonify({"error": "Authentication required"}), 401
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_void_agreement(user, agreement):
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "User denied access to void agreement",
                {
                    "agreement_id": agreement_id,
                    "user_id": user.id,
                    "agreement_status": agreement.status,
                },
            )
            return jsonify({"error": "Access denied"}), 403
        if data is None:
            request_data = request.get_json(silent=True) or {}
        else:
            request_data = data.model_dump(mode="json")
        reason = request_data.get("reason", "Voided by agent")
        log.debug(
            LOG_CATEGORIES["DOCUSIGN"],
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
            LOG_CATEGORIES["DOCUSIGN"],
            "Agreement voided successfully",
            {"agreement_id": agreement_id, "user_id": user.id, "reason": reason},
        )
        return jsonify({"success": True}), 200
    except DocusignError:
        # Let Flask error handlers deal with DocuSign-specific errors
        raise
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to void agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return SecureErrorHandler.handle_error(e, "Failed to void agreement")


def discard_agreement_action(agreement_id, data: VoidAgreementRequest | None = None):
    """Handle POST /agreements/<id>/discard — agent removes from Saved (void when possible)."""
    try:
        user = get_current_user()
        if not user:
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Unauthenticated discard agreement attempt",
                {"agreement_id": agreement_id},
            )
            return jsonify({"error": "Authentication required"}), 401
        agreement = AgreementLifecycleService.get_agreement(agreement_id)
        if not can_discard_agreement_as_agent(user, agreement):
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "User denied access to discard agreement",
                {
                    "agreement_id": agreement_id,
                    "user_id": user.id,
                    "agreement_status": agreement.status,
                },
            )
            return jsonify({"error": "Access denied"}), 403
        if data is None:
            request_data = request.get_json(silent=True) or {}
        else:
            request_data = data.model_dump(mode="json")
        reason = request_data.get("reason", "Discarded by agent")
        log.debug(
            LOG_CATEGORIES["DOCUSIGN"],
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
            LOG_CATEGORIES["DOCUSIGN"],
            "Agreement discarded successfully",
            {"agreement_id": agreement_id, "user_id": user.id, "reason": reason},
        )
        return jsonify({"success": True}), 200
    except DocusignError:
        raise
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to discard agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return SecureErrorHandler.handle_error(e, "Failed to discard agreement")
