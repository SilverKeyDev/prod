"""GET /api/v1/admin/rev-share/analytics."""

from __future__ import annotations

from app.schemas import RevShareAnalyticsQueryParams, RevShareAnalyticsResponse
from app.services.rev_share.analytics import RevShareAnalyticsFilters, get_rev_share_analytics
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.route import not_found
from app.utils.security.admin_roles import user_has_admin_role
from app.utils.validation import validate_query, validate_response
from logger import log


@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(RevShareAnalyticsQueryParams)
@validate_response(RevShareAnalyticsResponse)
def get_admin_rev_share_analytics(user, query: RevShareAnalyticsQueryParams):
    if not user_has_admin_role(user):
        log.security(
            "SECURITY",
            "Unauthorized rev-share analytics",
            {"user_id": getattr(user, "id", None)},
        )
        return standardize_error_response(
            "Admin access required", status_code=403, error_code="admin_forbidden"
        )

    params = query
    raw_bucket = params.bucket
    if raw_bucket is None:
        bucket = "day"
    elif hasattr(raw_bucket, "value"):
        bucket = raw_bucket.value
    else:
        bucket = str(raw_bucket)
    filters = RevShareAnalyticsFilters(
        partner_id=params.partner_id.strip(),
        step_id=(params.step_id or "").strip() or None,
        date_from=params.date_from,
        date_to=params.date_to,
        agent_id=(params.agent_id or "").strip() or None,
        brokerage=(params.brokerage or "").strip() or None,
        bucket=bucket,
    )
    result = get_rev_share_analytics(filters)
    if not result.get("success"):
        return not_found()
    return standardize_success_response({"data": result})
