"""GET/PATCH current user's search display settings."""

from __future__ import annotations

from flask import jsonify

from app.schemas import SearchDisplayPayload, SearchDisplayResponse
from app.services.auth.search_display import (
    SearchDisplayPatchError,
    apply_search_display_patch,
    get_or_create_search_display,
    row_to_dict,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    invalid_request,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.validation import validate_request, validate_response
from logger import log


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(SearchDisplayResponse)
def get_search_display(user):
    try:
        row = get_or_create_search_display(str(user.id))
        return jsonify({"success": True, "search_display": row_to_dict(row)})
    except Exception as e:
        return server_error(
            e,
            context={"function": "get_search_display", "user_id": getattr(user, "id", "unknown")},
        )


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(SearchDisplayResponse)
@validate_request(SearchDisplayPayload)
def patch_search_display(user, data: SearchDisplayPayload):
    body = data.model_dump(exclude_unset=True)

    if not body:
        log.warn("AUTH", "patch_search_display_empty_body", None)
        return invalid_request("No data provided")

    try:
        row = apply_search_display_patch(str(user.id), body)
        return jsonify(
            {
                "success": True,
                "message": "Search display updated",
                "search_display": row_to_dict(row),
            }
        )
    except SearchDisplayPatchError as e:
        return validation(e.message)
    except Exception as e:
        return server_error(
            e,
            context={"function": "patch_search_display", "user_id": getattr(user, "id", "unknown")},
        )
