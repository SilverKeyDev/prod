"""
Delete normalized preference rows for a user and clear preference metadata on User.
"""

from __future__ import annotations

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

    UserIntentAttribute.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserImportantLocation.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserFinancials.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserDemographics.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserCommunicationPrefs.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserSearchIntent.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserScoreWeights.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserPropertyHighlights.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserPropertyCommute.query.filter_by(user_id=uid).delete(synchronize_session=False)
    UserPropertyLink.query.filter_by(user_id=uid).delete(synchronize_session=False)

    u.has_preferences = False
    u.preferences_version = None
    db.session.add(u)
    return u
