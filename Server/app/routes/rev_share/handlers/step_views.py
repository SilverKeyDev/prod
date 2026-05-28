"""POST /api/v1/rev-share/step-views — record buyer step view."""

from __future__ import annotations

from flask import request

from app.services.analytics.posthog_events import capture_product_event
from app.services.rev_share.partner_steps import list_active_partners_for_step
from app.services.rev_share.step_views import record_buyer_step_view
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from logger import LOG_CATEGORIES, log


def _is_buyer_user(user) -> bool:
    if user_has_admin_role(user):
        return True
    roles = [row.role for row in getattr(user, "user_roles", []) or []]
    return "buyer" in roles or not getattr(user, "is_agent", False)


def _partner_ids_for_step(step_id: str) -> list[str]:
    return [str(p.id) for p in list_active_partners_for_step(step_id)]


@handle_exceptions_with_logging
@require_authenticated_user
def post_step_view(user):
    data = request.get_json(silent=True) or {}
    step_id = (data.get("step_id") or "").strip()
    transaction_id = (data.get("transaction_id") or "").strip()
    if not step_id or not transaction_id:
        return standardize_error_response(
            "step_id and transaction_id are required", status_code=400
        )
    if not _is_buyer_user(user):
        return standardize_error_response("Buyer access required", status_code=403)

    row, created = record_buyer_step_view(
        buyer_id=user.id,
        step_id=step_id,
        transaction_id=transaction_id,
    )
    if not row:
        return standardize_error_response("transaction_not_found", status_code=404)

    if created:
        partner_ids = _partner_ids_for_step(step_id)
        exposure_payload = {
            "step_id": step_id,
            "transaction_id": row.transaction_id,
            "buyer_id": str(user.id),
            "partner_ids": partner_ids,
        }
        # RESPA: auditable brokerage-level placement exposure (not per-referral compensation).
        log.info(LOG_CATEGORIES["SECURITY"], "partner_placement_viewed", exposure_payload)
        capture_product_event(
            str(user.id),
            "partner_placement_viewed",
            properties=exposure_payload,
        )

    return standardize_success_response({"data": row.to_dict()})
