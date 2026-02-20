"""DocuSign agreement action handlers (revision, send, void, etc.)."""

from flask import jsonify, request

from app.services.auth import get_current_user
from app.services.docusign import AgreementLifecycleService, RevisionService
from app.services.docusign.utils.permissions import (
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
        filename = file.filename
        if not filename or not isinstance(filename, str):
            log.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Revision creation without filename",
                {"agreement_id": agreement_id, "user_id": user.id},
            )
            return jsonify({"success": False, "error": "File must have a filename"}), 400
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
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to create revision",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return SecureErrorHandler.handle_error(e, "Failed to create revision")


def send_agreement_action(agreement_id):
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
        data = request.json or {}
        signing_method = data.get("signing_method", "embedded")
        log.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Sending agreement for signature",
            {
                "agreement_id": agreement_id,
                "user_id": user.id,
                "signing_method": signing_method,
                "agreement_status": agreement.status,
            },
        )
        task_id = AgreementLifecycleService.send_for_signature(
            agreement_id=agreement_id, signing_method=signing_method, actor_id=user.id
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
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to send agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return SecureErrorHandler.handle_error(e, "Failed to send agreement")


def void_agreement_action(agreement_id):
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
        data = request.json or {}
        reason = data.get("reason", "Voided by agent")
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
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to void agreement",
            {"agreement_id": agreement_id, "error": str(e)},
        )
        return SecureErrorHandler.handle_error(e, "Failed to void agreement")
