"""POST /api/v1/rev-share/step-views — record buyer step view."""

from __future__ import annotations

from app.dtos.partner import BuyerStepViewDTO
from app.schemas import RevShareStepViewRequest, RevShareStepViewResponse
from app.services.analytics.posthog_events import capture_product_event
from app.services.auth.user_role_helpers import user_is_agent
from app.services.rev_share.partner_steps import list_active_partners_for_step
from app.services.rev_share.step_views import record_buyer_step_view
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.route import not_found
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_request, validate_response
from logger import log


def _is_buyer_user(user) -> bool:
    if user_has_admin_role(user):
        return True
    roles = [row.role for row in getattr(user, "user_roles", []) or []]
    return "buyer" in roles or not user_is_agent(user)


def _partner_ids_for_step(step_id: str) -> list[str]:
    return [str(p.id) for p in list_active_partners_for_step(step_id)]


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(RevShareStepViewRequest)
@validate_response(RevShareStepViewResponse)
def post_step_view(user, data: RevShareStepViewRequest):
    step_id = data.step_id.strip()
    transaction_id = data.transaction_id.strip()
    if not _is_buyer_user(user):
        return standardize_error_response(
            "Buyer access required", status_code=403, error_code="authorization_failed"
        )

    row, created = record_buyer_step_view(
        buyer_id=user.id,
        step_id=step_id,
        transaction_id=transaction_id,
    )
    if not row:
        return not_found()

    if created:
        partner_ids = _partner_ids_for_step(step_id)
        exposure_payload = {
            "step_id": step_id,
            "transaction_id": row.transaction_id,
            "buyer_id": str(user.id),
            "partner_ids": partner_ids,
        }
        # RESPA: auditable brokerage-level placement exposure (not per-referral compensation).
        log.info("SECURITY", "partner_placement_viewed", exposure_payload)
        capture_product_event(
            str(user.id),
            "partner_placement_viewed",
            properties=exposure_payload,
        )

    return standardize_success_response({"data": BuyerStepViewDTO.to_response(row)})
