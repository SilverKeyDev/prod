"""Client settings row persistence."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models.user.user_client_settings import UserClientSettings
from app.utils.db import db_transaction

from .state import (
    assert_settings_size,
    default_settings,
    merge_and_sanitize,
    sanitize_settings,
)


def row_settings(row: UserClientSettings) -> dict[str, Any]:
    raw = row.settings
    if not isinstance(raw, dict):
        return sanitize_settings(None)
    return sanitize_settings(raw)


def get_or_create_client_settings(user_id: str) -> UserClientSettings:
    row = db.session.scalar(select(UserClientSettings).where(UserClientSettings.user_id == user_id))
    if row is None:
        row = UserClientSettings(
            user_id=user_id,
            settings=dict(default_settings()),
            schema_version=1,
        )
        with db_transaction():
            db.session.add(row)
    return row


def apply_client_settings_patch(user_id: str, patch_body: dict[str, Any]) -> dict[str, Any]:
    """Merge patch into stored settings and persist. Returns merged settings dict."""
    row = get_or_create_client_settings(user_id)
    existing = row.settings if isinstance(row.settings, dict) else {}
    merged = merge_and_sanitize(existing, patch_body)
    assert_settings_size(merged)
    with db_transaction():
        row.settings = merged
        row.schema_version = int(merged.get("v", 1) or 1)
        db.session.add(row)
    return merged
