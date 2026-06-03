"""GET/PATCH current user's client UI settings (JSON document)."""

from __future__ import annotations

from typing import Any

from flask import jsonify
from sqlalchemy import select

from app import db
from app.models.user.user_client_settings import UserClientSettings
from app.schemas import ClientSettings, ClientSettingsResponse
from app.services.client_settings import (
    assert_settings_size,
    default_settings,
    merge_and_sanitize,
    sanitize_settings,
)
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.validation import validate_request, validate_response


def _row_settings(row: UserClientSettings) -> dict[str, Any]:
    raw = row.settings
    if not isinstance(raw, dict):
        return sanitize_settings(None)
    return sanitize_settings(raw)


def _get_or_create(user_id: str) -> UserClientSettings:
    row = db.session.scalar(select(UserClientSettings).where(UserClientSettings.user_id == user_id))
    if row is None:
        row = UserClientSettings(
            user_id=user_id,
            settings=dict(default_settings()),
            schema_version=1,
        )
        db.session.add(row)
        db.session.commit()
    return row


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(ClientSettingsResponse)
def get_client_settings(user):
    try:
        row = _get_or_create(str(user.id))
        settings = _row_settings(row)
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
        row = _get_or_create(str(user.id))
        existing = row.settings if isinstance(row.settings, dict) else {}
        merged = merge_and_sanitize(existing, patch_body)
        assert_settings_size(merged)
        row.settings = merged
        row.schema_version = int(merged.get("v", 1) or 1)
        db.session.add(row)
        db.session.commit()
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
        db.session.rollback()
        return server_error(
            e,
            context={
                "function": "patch_client_settings",
                "user_id": getattr(user, "id", "unknown"),
            },
        )
