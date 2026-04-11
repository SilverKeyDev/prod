"""Agreement participant management routes."""

from flask import jsonify, request

from app.schemas import (
    CreateParticipantRequest,
    CreateParticipantResponse,
    UpdateRoutingOrderRequest,
    UpdateRoutingOrderResponse,
)
from app.services.auth import get_current_user
from app.services.docusign import AgreementLifecycleService
from app.services.docusign.utils.permissions import can_access_agreement, is_agent
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


def register_participant_routes(bp):
    @bp.route("/agreements/<agreement_id>/participants", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    @validate_request(CreateParticipantRequest)
    @validate_response(CreateParticipantResponse)
    def add_participant(agreement_id, data: CreateParticipantRequest | None = None):
        try:
            user = get_current_user()
            if not user or not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to add participant",
                    {"agreement_id": agreement_id, "user_id": user.id if user else None},
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403

            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "User denied access to add participant",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "Access denied"}), 403

            if data is None:
                request_data = request.get_json(silent=True)
                if request_data is None:
                    return jsonify({"success": False, "error": "Request body required"}), 400
            else:
                request_data = data.model_dump(mode="json")

            required_fields = ["user_id"]
            for field in required_fields:
                if field not in request_data:
                    log.warn(
                        LOG_CATEGORIES["DOCUSIGN"],
                        "Missing required field for add participant",
                        {"field": field, "agreement_id": agreement_id},
                    )
                    return jsonify(
                        {"success": False, "error": f"Missing required field: {field}"}
                    ), 400

            raw_role = request_data.get("role")
            if raw_role is None:
                role_str = "signer"
            elif isinstance(raw_role, str):
                role_str = raw_role
            else:
                role_str = getattr(raw_role, "value", str(raw_role))
            participant = AgreementLifecycleService.add_participant(
                agreement_id=agreement_id,
                user_id=request_data["user_id"],
                role=role_str,
                routing_order=request_data.get("routing_order"),
                actor_id=user.id,
            )

            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Participant added successfully",
                {
                    "agreement_id": agreement_id,
                    "participant_id": participant.id,
                    "user_id": request_data["user_id"],
                },
            )

            return jsonify({"success": True, "participant": participant.to_dict()}), 201
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to add participant",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return SecureErrorHandler.handle_error(e, "Failed to add participant")

    @bp.route("/agreements/<agreement_id>/participants/<participant_id>", methods=["DELETE"])
    @rate_limit(max_requests=20, window_seconds=60)
    def remove_participant(agreement_id, participant_id):
        try:
            user = get_current_user()
            if not user or not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to remove participant",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id if user else None,
                    },
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403

            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "User denied access to remove participant",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "Access denied"}), 403

            AgreementLifecycleService.remove_participant(
                agreement_id=agreement_id, participant_id=participant_id
            )

            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Participant removed successfully",
                {"agreement_id": agreement_id, "participant_id": participant_id},
            )

            return jsonify({"success": True, "message": "Participant removed"}), 200
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to remove participant",
                {"agreement_id": agreement_id, "participant_id": participant_id, "error": str(e)},
            )
            return SecureErrorHandler.handle_error(e, "Failed to remove participant")

    @bp.route(
        "/agreements/<agreement_id>/participants/<participant_id>/routing-order", methods=["PATCH"]
    )
    @rate_limit(max_requests=20, window_seconds=60)
    @validate_request(UpdateRoutingOrderRequest)
    @validate_response(UpdateRoutingOrderResponse)
    def update_participant_routing_order(
        agreement_id, participant_id, data: UpdateRoutingOrderRequest | None = None
    ):
        try:
            user = get_current_user()
            if not user or not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to update routing order",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id if user else None,
                    },
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403

            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "User denied access to update routing order",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return jsonify({"success": False, "error": "Access denied"}), 403

            if data is None:
                request_data = request.get_json(silent=True) or {}
            else:
                request_data = data.model_dump(mode="json")
            if "routing_order" not in request_data:
                return jsonify({"success": False, "error": "routing_order field required"}), 400

            participant = AgreementLifecycleService.update_participant_routing_order(
                agreement_id=agreement_id,
                participant_id=participant_id,
                new_routing_order=request_data["routing_order"],
            )

            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Participant routing order updated",
                {
                    "agreement_id": agreement_id,
                    "participant_id": participant_id,
                    "new_routing_order": request_data["routing_order"],
                },
            )

            return jsonify({"success": True, "participant": participant.to_dict()}), 200
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to update routing order",
                {"agreement_id": agreement_id, "participant_id": participant_id, "error": str(e)},
            )
            return SecureErrorHandler.handle_error(e, "Failed to update routing order")
