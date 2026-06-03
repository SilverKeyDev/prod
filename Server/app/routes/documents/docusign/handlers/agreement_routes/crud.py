"""Agreement CRUD routes: create, get, list."""

from flask import jsonify, request

from app.dtos.agreement import AgreementDTO
from app.models import Agreement
from app.schemas import CreateAgreementRequest, CreateAgreementResponse
from app.services.docusign import AgreementLifecycleService
from app.services.docusign.utils.permissions import can_access_agreement, is_agent
from app.utils.common_patterns import require_authenticated_user
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


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
    def create_agreement(user, data: CreateAgreementRequest | None = None):
        try:
            if not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to create agreement",
                    {"user_id": user.id},
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403
            if data is None:
                request_data = request.get_json(silent=True)
                if request_data is None:
                    return jsonify({"success": False, "error": "Request body required"}), 400
            else:
                request_data = data.model_dump(mode="json")
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
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
                        LOG_CATEGORIES["DOCUSIGN"],
                        "Missing required field",
                        {"field": field, "agent_id": user.id},
                    )
                    return jsonify(
                        {"success": False, "error": f"Missing required field: {field}"}
                    ), 400
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
                LOG_CATEGORIES["DOCUSIGN"],
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
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to create agreement", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to create agreement")

    @bp.route("/agreements/<agreement_id>", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    @require_authenticated_user
    def get_agreement(user, agreement_id):
        try:
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
                {
                    "success": True,
                    "agreement": _agreement_payload(agreement, include_relationships=True),
                }
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
    @require_authenticated_user
    def list_agreements(user):
        try:
            # Add pagination support
            limit = min(100, max(1, int(request.args.get("limit", "100"))))
            offset = max(0, int(request.args.get("offset", "0")))

            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Listing agreements",
                {"user_id": user.id, "is_agent": is_agent(user), "limit": limit, "offset": offset},
            )

            if is_agent(user):
                query = Agreement.query.filter_by(agent_id=user.id).order_by(
                    Agreement.updated_at.desc()
                )
            else:
                query = Agreement.query.filter_by(buyer_id=user.id).order_by(
                    Agreement.updated_at.desc()
                )

            total_count = query.count()
            agreements = query.limit(limit).offset(offset).all()

            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreements listed successfully",
                {
                    "user_id": user.id,
                    "count": len(agreements),
                    "total": total_count,
                    "is_agent": is_agent(user),
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
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to list agreements", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to list agreements")
