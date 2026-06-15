"""
Delete normalized preference rows for a user and clear preference metadata on User.
"""

from __future__ import annotations

from sqlalchemy import delete

from app import db
from app.models import (
    User,
    UserCommunicationPrefs,
    UserDemographics,
    UserFinancials,
    UserImportantLocation,
    UserIntentAttribute,
    UserPropertyCommute,
    UserPropertyHighlights,
    UserPropertyLink,
    UserScoreWeights,
    UserSearchIntent,
)
from app.utils.db.orm_lookup import get_model


def clear_user_preferences(user_id: str, *, user: User | None = None) -> User:
    """
    Remove all preference-related rows for the user and set has_preferences=False.

    Does not remove UserAgentProfile (agent profile is separate from buyer search prefs).
    Caller is responsible for committing the session when used inside a larger transaction.
    """
    uid = str(user_id).strip()
    if not uid:
        raise ValueError("user_id is required")

    u = user or get_model(User, uid)
    if not u:
        raise ValueError(f"User not found: {uid}")

    db.session.execute(delete(UserIntentAttribute).where(UserIntentAttribute.user_id == uid))
    db.session.execute(delete(UserImportantLocation).where(UserImportantLocation.user_id == uid))
    db.session.execute(delete(UserFinancials).where(UserFinancials.user_id == uid))
    db.session.execute(delete(UserDemographics).where(UserDemographics.user_id == uid))
    db.session.execute(delete(UserCommunicationPrefs).where(UserCommunicationPrefs.user_id == uid))
    db.session.execute(delete(UserSearchIntent).where(UserSearchIntent.user_id == uid))
    db.session.execute(delete(UserScoreWeights).where(UserScoreWeights.user_id == uid))
    db.session.execute(delete(UserPropertyHighlights).where(UserPropertyHighlights.user_id == uid))
    db.session.execute(delete(UserPropertyCommute).where(UserPropertyCommute.user_id == uid))
    db.session.execute(delete(UserPropertyLink).where(UserPropertyLink.user_id == uid))

    u.has_preferences = False
    u.preferences_version = None
    db.session.add(u)
    return u
