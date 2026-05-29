"""GET /api/v1/admin/rev-share/analytics."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import request

from app.services.rev_share.analytics import RevShareAnalyticsFilters, get_rev_share_analytics
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.security.admin_roles import user_has_admin_role
from logger import LOG_CATEGORIES, log


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


@handle_exceptions_with_logging
@require_authenticated_user
def get_admin_rev_share_analytics(user):
    if not user_has_admin_role(user):
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Unauthorized rev-share analytics",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response(
            "Admin access required", status_code=403, error_code="admin_forbidden"
        )

    partner_id = (request.args.get("partner_id") or "").strip()
    if not partner_id:
        return standardize_error_response(
            "partner_id is required", status_code=400, error_code="validation_error"
        )

    filters = RevShareAnalyticsFilters(
        partner_id=partner_id,
        step_id=(request.args.get("step_id") or "").strip() or None,
        date_from=_parse_dt(request.args.get("date_from")),
        date_to=_parse_dt(request.args.get("date_to")),
        agent_id=(request.args.get("agent_id") or "").strip() or None,
        brokerage=(request.args.get("brokerage") or "").strip() or None,
        bucket=(request.args.get("bucket") or "day").strip(),
    )
    result = get_rev_share_analytics(filters)
    if not result.get("success"):
        err = result.get("error", "unknown")
        return standardize_error_response(
            str(err) if err != "unknown" else "Analytics data not found",
            status_code=404,
            error_code="resource_not_found",
        )
    return standardize_success_response({"data": result})
