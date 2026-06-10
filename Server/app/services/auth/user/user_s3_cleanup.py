"""User-scoped S3 object deletion for dev reset and hard delete."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import Document, User
from app.services.auth.user.delete_user_external_cleanup import (
    USER_S3_PREFIX_TEMPLATES,
    _delete_user_s3_objects,
)
from logger import log


def collect_user_s3_keys(user_id: str, *, user: User | None = None) -> list[str]:
    """Gather explicit S3 keys from profile picture and document rows."""
    uid = str(user_id).strip()
    if not uid:
        return []

    keys: list[str] = []
    seen: set[str] = set()

    profile_user = (
        user if user is not None else db.session.scalar(select(User).where(User.id == uid))
    )
    if profile_user and profile_user.profile_picture:
        key = str(profile_user.profile_picture).strip()
        if key and key not in seen:
            seen.add(key)
            keys.append(key)

    for doc in db.session.scalars(select(Document).where(Document.user_id == uid)).all():
        if doc.file_path:
            key = str(doc.file_path).strip()
            if key and key not in seen:
                seen.add(key)
                keys.append(key)

    return keys


def delete_user_scoped_s3_objects(
    user_id: str,
    extra_s3_keys: list[str] | None = None,
) -> dict[str, int]:
    """Delete objects under user prefixes plus any explicit keys. Best-effort."""
    uid = str(user_id).strip()
    if not uid:
        return {"prefix_deleted": 0, "keys_deleted": 0}

    try:
        return _delete_user_s3_objects(uid, extra_s3_keys)
    except Exception as exc:
        log.warn(
            "API",
            "delete_user_scoped_s3_objects failed",
            {"user_id": uid, "error": str(exc)},
        )
        return {"prefix_deleted": 0, "keys_deleted": 0}


def delete_profile_picture_s3_key(profile_picture_key: str | None) -> None:
    """Best-effort delete of a single profile picture S3 key."""
    key = (profile_picture_key or "").strip()
    if not key:
        return
    delete_user_scoped_s3_objects("", extra_s3_keys=[key])


__all__ = [
    "USER_S3_PREFIX_TEMPLATES",
    "collect_user_s3_keys",
    "delete_profile_picture_s3_key",
    "delete_user_scoped_s3_objects",
]
