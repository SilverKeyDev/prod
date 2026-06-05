"""GET/PATCH current user's client UI settings (JSON document)."""

from __future__ import annotations

from flask import jsonify

from app.schemas import ClientSettings, ClientSettingsResponse
from app.services.client_settings import (
    apply_client_settings_patch,
    get_or_create_client_settings,
    row_settings,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.validation import validate_request, validate_response


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(ClientSettingsResponse)
def get_client_settings(user):
    try:
        row = get_or_create_client_settings(str(user.id))
        settings = row_settings(row)
        return jsonify({"success": True, "client_settings": settings})
    except Exception as e:
        return server_error(
            e,
            context={"function": "get_client_settings", "user_id": getattr(user, "id", "unknown")},
        )


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(ClientSettings)
@validate_response(ClientSettingsResponse)
def patch_client_settings(user, data: ClientSettings):
    patch_body = data.model_dump(exclude_unset=True)

    try:
        merged = apply_client_settings_patch(str(user.id), patch_body)
        return jsonify(
            {
                "success": True,
                "message": "Client settings updated",
                "client_settings": merged,
            }
        )
    except ValueError:
        return validation("Client settings payload too large")
    except Exception as e:
        return server_error(
            e,
            context={
                "function": "patch_client_settings",
                "user_id": getattr(user, "id", "unknown"),
            },
        )
