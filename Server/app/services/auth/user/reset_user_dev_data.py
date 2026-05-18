"""
Scoped dev/test reset for profile, preferences, and DocuSign data.

Does not remove the user row, gate roles, connections, or transactions.
"""

from __future__ import annotations

import os

from app import db
from app.models import (
    DocusignOAuthToken,
    User,
    UserAgentProfile,
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
from app.services.auth.user.agreement_cleanup import delete_agreements_for_user
from logger import LOG_CATEGORIES, log

VALID_SCOPES = frozenset({"profile", "preferences", "docusign"})


def dev_user_data_reset_enabled() -> bool:
    """True when dev data reset is allowed (non-production or explicit prod override)."""
    if os.getenv("FLASK_ENV") != "production":
        return True
    return os.getenv("ENABLE_DEV_USER_DATA_RESET", "").lower() in ("1", "true", "yes")


def reset_user_dev_data(user_id: str, scopes: set[str]) -> dict[str, bool] | None:
    """
    Apply scoped resets for an existing user.

    Returns:
        Dict mapping each requested scope to True if applied, or None if user not found.
    """
    if not user_id or not str(user_id).strip():
        log.warn(LOG_CATEGORIES["API"], "reset_user_dev_data: empty user_id")
        return None

    unknown = scopes - VALID_SCOPES
    if unknown:
        raise ValueError(f"Invalid scopes: {sorted(unknown)}")

    uid = str(user_id).strip()
    user = User.query.filter_by(id=uid).one_or_none()
    if user is None:
        log.info(LOG_CATEGORIES["API"], "reset_user_dev_data: user not found", {"user_id": uid})
        return None

    cleared: dict[str, bool] = {}

    try:
        if "profile" in scopes:
            _reset_profile(uid, user)
            cleared["profile"] = True

        if "preferences" in scopes:
            _reset_preferences(uid, user)
            cleared["preferences"] = True

        if "docusign" in scopes:
            _reset_docusign(uid)
            cleared["docusign"] = True

        db.session.commit()
        log.info(
            LOG_CATEGORIES["API"],
            "reset_user_dev_data: completed",
            {"user_id": uid, "scopes": sorted(cleared.keys())},
        )
        return cleared
    except Exception as exc:
        db.session.rollback()
        log.error(
            LOG_CATEGORIES["ERRORS"],
            f"reset_user_dev_data failed user_id={uid}",
            exc,
        )
        raise


def _reset_profile(uid: str, user: User) -> None:
    UserAgentProfile.query.filter_by(user_id=uid).delete(synchronize_session=False)
    user.mls_id = None
    user.brokerage = None
    user.public_profile_slug = None
    user.profile_picture = None
    db.session.add(user)


def _reset_preferences(uid: str, user: User) -> None:
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
    user.has_preferences = False
    user.preferences_version = None
    db.session.add(user)


def _reset_docusign(uid: str) -> None:
    DocusignOAuthToken.query.filter_by(user_id=uid).delete(synchronize_session=False)
    delete_agreements_for_user(uid)
