"""Agreement participant management routes."""

from flask import jsonify

from app.dtos.documents import participant_payload
from app.schemas import (
    CreateParticipantRequest,
    CreateParticipantResponse,
    UpdateRoutingOrderRequest,
    UpdateRoutingOrderResponse,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.services.docusign import AgreementLifecycleService
from app.services.docusign.utils.permissions import can_access_agreement
from app.utils.common_patterns import (
    forbidden,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


def register_participant_routes(bp):
    @bp.route("/agreements/<agreement_id>/participants", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    @require_authenticated_user
    @validate_request(CreateParticipantRequest)
    @validate_response(CreateParticipantResponse)
    def add_participant(user, agreement_id, data: CreateParticipantRequest):
        try:
            if not user_is_agent(user):
                log.warn(
                    "DOCUSIGN",
                    "Non-agent attempted to add participant",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return forbidden()

            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    "DOCUSIGN",
                    "User denied access to add participant",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return forbidden()

            request_data = data.model_dump(mode="json")

            required_fields = ["user_id"]
            for field in required_fields:
                if field not in request_data:
                    log.warn(
                        "DOCUSIGN",
                        "Missing required field for add participant",
                        {"field": field, "agreement_id": agreement_id},
                    )
                    return validation(
                        f"Missing required field: {field}",
                        field_errors={field: "Required"},
                    )

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
                "DOCUSIGN",
                "Participant added successfully",
                {
                    "agreement_id": agreement_id,
                    "participant_id": participant.id,
                    "user_id": request_data["user_id"],
                },
            )

            return jsonify({"success": True, "participant": participant_payload(participant)}), 201
        except Exception as e:
            log.error(
                "ERRORS",
                "Failed to add participant",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return server_error(
                e, context={"function": "add_participant", "agreement_id": agreement_id}
            )

    @bp.route("/agreements/<agreement_id>/participants/<participant_id>", methods=["DELETE"])
    @rate_limit(max_requests=20, window_seconds=60)
    @require_authenticated_user
    def remove_participant(user, agreement_id, participant_id):
        try:
            if not user_is_agent(user):
                log.warn(
                    "DOCUSIGN",
                    "Non-agent attempted to remove participant",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id,
                    },
                )
                return forbidden()

            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    "DOCUSIGN",
                    "User denied access to remove participant",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return forbidden()

            AgreementLifecycleService.remove_participant(
                agreement_id=agreement_id, participant_id=participant_id
            )

            log.info(
                "DOCUSIGN",
                "Participant removed successfully",
                {"agreement_id": agreement_id, "participant_id": participant_id},
            )

            return jsonify({"success": True, "message": "Participant removed"}), 200
        except Exception as e:
            log.error(
                "ERRORS",
                "Failed to remove participant",
                {"agreement_id": agreement_id, "participant_id": participant_id, "error": str(e)},
            )
            return server_error(
                e,
                context={
                    "function": "remove_participant",
                    "agreement_id": agreement_id,
                    "participant_id": participant_id,
                },
            )

    @bp.route(
        "/agreements/<agreement_id>/participants/<participant_id>/routing-order", methods=["PATCH"]
    )
    @rate_limit(max_requests=20, window_seconds=60)
    @require_authenticated_user
    @validate_request(UpdateRoutingOrderRequest)
    @validate_response(UpdateRoutingOrderResponse)
    def update_participant_routing_order(
        user, agreement_id, participant_id, data: UpdateRoutingOrderRequest
    ):
        try:
            if not user_is_agent(user):
                log.warn(
                    "DOCUSIGN",
                    "Non-agent attempted to update routing order",
                    {
                        "agreement_id": agreement_id,
                        "participant_id": participant_id,
                        "user_id": user.id,
                    },
                )
                return forbidden()

            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    "DOCUSIGN",
                    "User denied access to update routing order",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return forbidden()

            request_data = data.model_dump(mode="json")
            if "routing_order" not in request_data:
                return validation(
                    "routing_order field required",
                    field_errors={"routing_order": "Required"},
                )

            participant = AgreementLifecycleService.update_participant_routing_order(
                agreement_id=agreement_id,
                participant_id=participant_id,
                new_routing_order=request_data["routing_order"],
            )

            log.info(
                "DOCUSIGN",
                "Participant routing order updated",
                {
                    "agreement_id": agreement_id,
                    "participant_id": participant_id,
                    "new_routing_order": request_data["routing_order"],
                },
            )

            return jsonify({"success": True, "participant": participant_payload(participant)}), 200
        except Exception as e:
            log.error(
                "ERRORS",
                "Failed to update routing order",
                {"agreement_id": agreement_id, "participant_id": participant_id, "error": str(e)},
            )
            return server_error(
                e,
                context={
                    "function": "update_participant_routing_order",
                    "agreement_id": agreement_id,
                    "participant_id": participant_id,
                },
            )
