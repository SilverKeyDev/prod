"""Assemble a portable JSON snapshot of user-owned data (GDPR/CCPA portability)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from app.dtos.user import UserDTO
from app.models import HomeNotInterested, UserPropertyLink
from app.models.user.user_client_settings import UserClientSettings
from app.services.client_settings import default_settings, sanitize_settings

if TYPE_CHECKING:
    from app.models.user import User


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_user_data_export(user: User) -> dict[str, Any]:
    """Return a JSON-serializable dict for API responses (not wrapped in success envelope)."""
    uid = str(user.id)
    profile = UserDTO.to_response(user, include_roles=True, presign_profile_pic=True)

    row = UserClientSettings.query.filter_by(user_id=uid).first()
    if row is None:
        client_settings = dict(default_settings())
    else:
        raw = row.settings
        if not isinstance(raw, dict):
            client_settings = sanitize_settings(None)
        else:
            client_settings = sanitize_settings(raw)

    liked_links = (
        UserPropertyLink.query.filter_by(user_id=uid, current=True, is_liked=True)
        .order_by(UserPropertyLink.updated_at.desc())
        .limit(2000)
        .all()
    )
    favorite_homes: list[dict[str, Any]] = []
    for link in liked_links:
        favorite_homes.append(
            {
                "property_id": str(link.property_id),
                "is_liked": bool(link.is_liked),
                "updated_at": link.updated_at.isoformat() if link.updated_at else None,
            }
        )

    not_interested_rows = HomeNotInterested.query.filter_by(
        user_id=uid, is_not_interested=True
    ).all()
    not_interested = [h.to_dict() for h in not_interested_rows]

    return {
        "format_version": 1,
        "exported_at": _iso_now(),
        "user_id": uid,
        "profile": profile,
        "client_settings": client_settings,
        "favorite_homes": favorite_homes,
        "not_interested_homes": not_interested,
    }
