"""User ORM → API response dict validated against OpenAPI User schema."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from pydantic import ValidationError

from app.models import User as UserModel
from app.schemas.generated import User as UserSchema
from logger import LOG_CATEGORIES, log

_PROFILE_PICTURE_EXT_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
}


def _profile_picture_content_type(s3_key: str) -> str:
    _, ext = os.path.splitext((s3_key or "").lower())
    return _PROFILE_PICTURE_EXT_TO_MIME.get(ext, "image/jpeg")


def _try_presigned_profile_picture_url(user: UserModel) -> str | None:
    """Return presigned profile picture URL if available; never raises."""
    from app.services.documents import s3_service

    if not getattr(user, "profile_picture", None):
        return None
    try:
        content_type = _profile_picture_content_type(user.profile_picture)
        return s3_service.generate_view_url(user.profile_picture, content_type=content_type)
    except Exception as e:
        log.warn(
            LOG_CATEGORIES["HTTP"],
            "Profile picture URL generation failed in UserDTO",
            {"user_id": str(user.id), "error": str(e)},
        )
        return None


class UserDTO:
    """Build User API payloads and validate against generated OpenAPI models."""

    @staticmethod
    def _iso_utc(dt: datetime | None) -> str | None:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    @classmethod
    def to_response(
        cls,
        user: UserModel,
        *,
        include_roles: bool = False,
        presign_profile_pic: bool = True,
    ) -> dict:
        is_active = user.is_active if user.is_active is not None else True

        data: dict = {
            "id": user.id,
            "cognito_id": user.cognito_id,
            "google_id": user.google_id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "profile_picture": user.profile_picture,
            "mls_id": user.mls_id,
            "brokerage": user.brokerage,
            "created_at": UserDTO._iso_utc(user.created_at),
            "updated_at": UserDTO._iso_utc(user.updated_at),
            "last_logged_in": UserDTO._iso_utc(user.last_logged_in),
            "is_active": is_active,
            "has_preferences": user.has_preferences,
            "preferences_version": user.preferences_version,
            "is_agent": bool(user.is_agent),
            "client_ids": user.client_ids,
            "agent_id": user.agent_id,
        }

        if include_roles:
            data["roles"] = [ur.role for ur in user.user_roles]

        # Brokerage roster membership (optional; no DB column until brokerage admin ships).
        data["brokerage_org_ids"] = getattr(user, "brokerage_org_ids", None)

        if presign_profile_pic:
            url = _try_presigned_profile_picture_url(user)
            if url is not None:
                data["profile_picture_url"] = url

        try:
            validated = UserSchema.model_validate(data)
        except ValidationError as e:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                f"User DTO validation failed: {e}",
                e,
            )
            raise ValueError(f"Invalid user data: {e}") from e

        return validated.model_dump(mode="json")

    @classmethod
    def to_list_response(cls, user: UserModel) -> dict:
        """Same schema, without roles or presigned profile URL (lighter for list views)."""
        return cls.to_response(user, include_roles=False, presign_profile_pic=False)
