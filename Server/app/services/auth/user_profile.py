"""User profile persistence."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.utils.db import db_transaction

if TYPE_CHECKING:
    from app.models.user import User


def persist_profile_picture_key(user: User, s3_key: str) -> None:
    """Store profile picture S3 key on the user row."""
    with db_transaction():
        user.profile_picture = s3_key
