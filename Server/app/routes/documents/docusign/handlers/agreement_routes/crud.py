"""Agreement CRUD routes: create, get, list."""

from flask import jsonify, request
from sqlalchemy import func, select

from app import db
from app.dtos.documents import AgreementDTO
from app.models import Agreement
from app.schemas import (
    CreateAgreementRequest,
    CreateAgreementResponse,
    GetAgreementResponse,
    ListAgreementsResponse,
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


def _agreement_payload(agreement: Agreement, *, include_relationships: bool = False) -> dict:
    return AgreementDTO.from_orm(agreement, include_relationships=include_relationships).model_dump(
        mode="json"
    )


def register_crud_routes(bp):
    @bp.route("/agreements", methods=["POST"])
    @rate_limit(max_requests=50, window_seconds=60)
    @require_authenticated_user
    @validate_request(CreateAgreementRequest)
    @validate_response(CreateAgreementResponse)
    def create_agreement(user, data: CreateAgreementRequest):
        try:
            if not user_is_agent(user):
                log.warn(
                    "DOCUSIGN",
                    "Non-agent attempted to create agreement",
                    {"user_id": user.id},
                )
                return forbidden()
            request_data = data.model_dump(mode="json")
            log.debug(
                "DOCUSIGN",
                "Creating agreement",
                {
                    "agent_id": user.id,
                    "buyer_id": request_data.get("buyer_id"),
                    "agreement_type": request_data.get("agreement_type"),
                    "title": request_data.get("title"),
                },
            )
            required_fields = ["title", "agreement_type", "buyer_id"]
            for field in required_fields:
                if field not in request_data:
                    log.warn(
                        "DOCUSIGN",
                        "Missing required field",
                        {"field": field, "agent_id": user.id},
                    )
                    return validation(
                        f"Missing required field: {field}",
                        field_errors={field: "Required"},
                    )
            agreement = AgreementLifecycleService.create_agreement(
                agent_id=user.id,
                buyer_id=request_data["buyer_id"],
                title=request_data["title"],
                agreement_type=request_data["agreement_type"],
                property_address=request_data.get("property_address"),
                description=request_data.get("description"),
                docusign_source_template_id=request_data.get("docusign_source_template_id"),
            )
            log.info(
                "DOCUSIGN",
                "Agreement created successfully",
                {
                    "agreement_id": agreement.id,
                    "agent_id": user.id,
                    "buyer_id": request_data["buyer_id"],
                    "agreement_type": request_data["agreement_type"],
                },
            )
            return jsonify(
                {
                    "success": True,
                    "agreement": _agreement_payload(agreement, include_relationships=True),
                }
            ), 201
        except Exception as e:
            log.error("ERRORS", "Failed to create agreement", {"error": str(e)})
            return server_error(e, context={"function": "create_agreement", "user_id": user.id})

    @bp.route("/agreements/<agreement_id>", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    @require_authenticated_user
    @validate_response(GetAgreementResponse)
    def get_agreement(user, agreement_id):
        try:
            log.debug(
                "DOCUSIGN",
                "Fetching agreement",
                {"agreement_id": agreement_id, "user_id": user.id},
            )
            agreement = AgreementLifecycleService.get_agreement(agreement_id)
            if not can_access_agreement(user, agreement):
                log.warn(
                    "DOCUSIGN",
                    "User denied access to agreement",
                    {"agreement_id": agreement_id, "user_id": user.id},
                )
                return forbidden()
            log.info(
                "DOCUSIGN",
                "Agreement retrieved successfully",
                {"agreement_id": agreement_id, "user_id": user.id, "status": agreement.status},
            )
            return jsonify(
                {
                    "success": True,
                    "agreement": _agreement_payload(agreement, include_relationships=True),
                }
            ), 200
        except Exception as e:
            log.error(
                "ERRORS",
                "Failed to get agreement",
                {"agreement_id": agreement_id, "error": str(e)},
            )
            return server_error(
                e, context={"function": "get_agreement", "agreement_id": agreement_id}
            )

    @bp.route("/agreements", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    @require_authenticated_user
    @validate_response(ListAgreementsResponse)
    def list_agreements(user):
        try:
            # Add pagination support
            limit = min(100, max(1, int(request.args.get("limit", "100"))))
            offset = max(0, int(request.args.get("offset", "0")))

            log.debug(
                "DOCUSIGN",
                "Listing agreements",
                {
                    "user_id": user.id,
                    "has_agent_role": user_is_agent(user),
                    "limit": limit,
                    "offset": offset,
                },
            )

            if user_is_agent(user):
                base_stmt = select(Agreement).where(Agreement.agent_id == user.id)
            else:
                base_stmt = select(Agreement).where(Agreement.buyer_id == user.id)

            total_count = db.session.scalar(select(func.count()).select_from(base_stmt.subquery()))
            agreements = db.session.scalars(
                base_stmt.order_by(Agreement.updated_at.desc()).limit(limit).offset(offset)
            ).all()

            log.info(
                "DOCUSIGN",
                "Agreements listed successfully",
                {
                    "user_id": user.id,
                    "count": len(agreements),
                    "total": total_count,
                    "has_agent_role": user_is_agent(user),
                },
            )

            return (
                jsonify(
                    {
                        "success": True,
                        "agreements": [_agreement_payload(a) for a in agreements],
                        "pagination": {
                            "limit": limit,
                            "offset": offset,
                            "total": total_count,
                            "hasMore": (offset + len(agreements)) < total_count,
                        },
                    }
                ),
                200,
            )
        except Exception as e:
            log.error("ERRORS", "Failed to list agreements", {"error": str(e)})
            return server_error(e, context={"function": "list_agreements", "user_id": user.id})
