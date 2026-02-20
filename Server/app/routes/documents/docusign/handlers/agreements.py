"""DocuSign agreement routes: create, get, list, revision, send, void, signing URL."""

from flask import jsonify, request

from app.models import Agreement, AgreementParticipant
from app.services.auth import get_current_user
from app.services.docusign import AgreementLifecycleService
from app.services.docusign.utils.permissions import (
    can_access_agreement,
    can_get_signing_url,
    is_agent,
)
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from logger import LOG_CATEGORIES, get_logger

from .agreement_actions import (
    create_revision_action,
    send_agreement_action,
    void_agreement_action,
)

log = get_logger()


def register_agreement_routes(bp):
    @bp.route("/agreements", methods=["POST"])
    @rate_limit(max_requests=50, window_seconds=60)
    def create_agreement():
        try:
            user = get_current_user()
            if not user or not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to create agreement",
                    {"user_id": user.id if user else None},
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403
            data = request.json
            if data is None:
                return jsonify({"success": False, "error": "Request body required"}), 400
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Creating agreement",
                {
                    "agent_id": user.id,
                    "buyer_id": data.get("buyer_id"),
                    "agreement_type": data.get("agreement_type"),
                    "title": data.get("title"),
                },
            )
            required_fields = ["title", "agreement_type", "buyer_id"]
            for field in required_fields:
                if field not in data:
                    log.warn(
                        LOG_CATEGORIES["DOCUSIGN"],
                        "Missing required field",
                        {"field": field, "agent_id": user.id},
                    )
                    return jsonify(
                        {"success": False, "error": f"Missing required field: {field}"}
                    ), 400
            agreement = AgreementLifecycleService.create_agreement(
                agent_id=user.id,
                buyer_id=data["buyer_id"],
                title=data["title"],
                agreement_type=data["agreement_type"],
                property_address=data.get("property_address"),
                description=data.get("description"),
            )
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreement created successfully",
                {
                    "agreement_id": agreement.id,
                    "agent_id": user.id,
                    "buyer_id": data["buyer_id"],
                    "agreement_type": data["agreement_type"],
                },
            )
            return jsonify(
                {"success": True, "agreement": agreement.to_dict(include_relationships=True)}
            ), 201
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to create agreement", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to create agreement")

    @bp.route("/agreements/<agreement_id>", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    def get_agreement(agreement_id):
        try:
            user = get_current_user()
            if not user:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Unauthenticated agreement access attempt",
                    {"agreement_id": agreement_id},
                )
                return jsonify({"success": False, "error": "Authentication required"}), 401
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Fetching agreement",
                {"agreement_id": agreement_id, "user_id": user.id},
            )
            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "User denied access to agreement",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "Access denied"}), 403
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreement retrieved successfully",
                {"agreement_id": agreement_id, "user_id": user.id, "status": agreement.status},
            )
            return jsonify(
                {"success": True, "agreement": agreement.to_dict(include_relationships=True)}
            ), 200
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to get agreement",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return SecureErrorHandler.handle_error(e, "Failed to get agreement")

    @bp.route("/agreements", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    def list_agreements():
        try:
            user = get_current_user()
            if not user:
                log.warn(LOG_CATEGORIES["DOCUSIGN"], "Unauthenticated list agreements attempt")
                return jsonify({"success": False, "error": "Authentication required"}), 401
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Listing agreements",
                {"user_id": user.id, "is_agent": is_agent(user)},
            )
            if is_agent(user):
                agreements = Agreement.query.filter_by(agent_id=user.id).all()
            else:
                agreements = Agreement.query.filter_by(buyer_id=user.id).all()
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreements listed successfully",
                {"user_id": user.id, "count": len(agreements), "is_agent": is_agent(user)},
            )
            return jsonify({"success": True, "agreements": [a.to_dict() for a in agreements]}), 200
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to list agreements", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to list agreements")

    @bp.route("/agreements/<agreement_id>/revisions", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    def create_revision(agreement_id):
        return create_revision_action(agreement_id)

    @bp.route("/agreements/<agreement_id>/send", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    def send_agreement(agreement_id):
        return send_agreement_action(agreement_id)

    @bp.route("/agreements/<agreement_id>/void", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    def void_agreement(agreement_id):
        return void_agreement_action(agreement_id)

    @bp.route("/agreements/<agreement_id>/signing-url", methods=["POST"])
    @rate_limit(max_requests=50, window_seconds=60)
    def get_signing_url(agreement_id):
        try:
            user = get_current_user()
            if not user:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Unauthenticated signing URL request",
                    {"agreement_id": agreement_id},
                )
                return jsonify({"success": False, "error": "Authentication required"}), 401
            data = request.json or {}
            participant_id = data.get("participant_id")
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
