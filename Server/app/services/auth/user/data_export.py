"""Assemble a portable JSON snapshot of user-owned data (GDPR/CCPA portability)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from app import db
from app.dtos.property import NotInterestedHomeDTO
from app.dtos.user import UserDTO
from app.models import HomeNotInterested, UserPropertyLink
from app.models.user.user_client_settings import UserClientSettings
from app.services.client_settings import default_settings, sanitize_settings

if TYPE_CHECKING:
    from app.models.user import User


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


_PROFILE_SENSITIVE_KEYS = frozenset(
    {
        "cognito_id",
        "google_id",
        "profile_picture",  # raw S3 key; profile_picture_url (presigned) is retained
    }
)


def build_user_data_export(user: User) -> dict[str, Any]:
    """Return a JSON-serializable dict for API responses (not wrapped in success envelope)."""
    uid = str(user.id)
    profile = UserDTO.to_response(user, include_roles=True, presign_profile_pic=True)
    for key in _PROFILE_SENSITIVE_KEYS:
        profile.pop(key, None)

    row = db.session.scalar(select(UserClientSettings).where(UserClientSettings.user_id == uid))
    if row is None:
        client_settings = dict(default_settings())
    else:
        raw = row.settings
        if not isinstance(raw, dict):
            client_settings = sanitize_settings(None)
        else:
            client_settings = sanitize_settings(raw)

    liked_links = db.session.scalars(
        select(UserPropertyLink)
        .where(
            UserPropertyLink.user_id == uid,
            UserPropertyLink.current.is_(True),
            UserPropertyLink.is_liked.is_(True),
        )
        .order_by(UserPropertyLink.updated_at.desc())
        .limit(2000)
    ).all()
    favorite_homes: list[dict[str, Any]] = []
    for link in liked_links:
        favorite_homes.append(
            {
                "property_id": str(link.property_id),
                "is_liked": bool(link.is_liked),
                "updated_at": link.updated_at.isoformat() if link.updated_at else None,
            }
        )

    not_interested_rows = db.session.scalars(
        select(HomeNotInterested).where(
            HomeNotInterested.user_id == uid,
            HomeNotInterested.is_not_interested.is_(True),
        )
    ).all()
    not_interested = [NotInterestedHomeDTO.to_export_row(h) for h in not_interested_rows]

    return {
        "format_version": 1,
        "exported_at": _iso_now(),
        "user_id": uid,
        "profile": profile,
        "client_settings": client_settings,
        "favorite_homes": favorite_homes,
        "not_interested_homes": not_interested,
    }
