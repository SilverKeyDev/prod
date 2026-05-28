"""GET /api/v1/partners/placements — buyer checklist partner cards."""

from __future__ import annotations

from flask import request

from app.services.rev_share.placements import get_placements_for_step
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    standardize_error_response,
    standardize_success_response,
)


@handle_exceptions_with_logging
@require_authenticated_user
def get_placements(user):
    step_id = (request.args.get("step_id") or "").strip()
    workspace = (request.args.get("workspace") or "").strip()
    transaction_id = (request.args.get("transaction_id") or "").strip() or None

    if not step_id:
        return standardize_error_response("step_id is required", status_code=400)
    if not workspace:
        return standardize_error_response("workspace is required", status_code=400)

    placements = get_placements_for_step(
        step_id=step_id,
        workspace=workspace,
        transaction_id=transaction_id,
    )
    return standardize_success_response({"data": {"placements": placements}})
