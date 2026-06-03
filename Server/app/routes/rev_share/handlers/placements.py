"""GET /api/v1/partners/placements — buyer checklist partner cards."""

from __future__ import annotations

from app.schemas import PartnerPlacementsQueryParams, RevSharePlacementsResponse
from app.services.rev_share.placements import get_placements_for_step
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)
from app.utils.validation import validate_query, validate_response


@handle_exceptions_with_logging
@require_authenticated_user
@validate_query(PartnerPlacementsQueryParams)
@validate_response(RevSharePlacementsResponse)
def get_placements(user, query: PartnerPlacementsQueryParams | None = None):
    if query is None:
        return standardize_error_response(
            "step_id and workspace are required",
            status_code=400,
            error_code="validation_error",
        )
    params = query
    placements = get_placements_for_step(
        step_id=params.step_id.strip(),
        workspace=params.workspace.value,
        transaction_id=(params.transaction_id or "").strip() or None,
    )
    return standardize_success_response({"data": {"placements": placements}})
