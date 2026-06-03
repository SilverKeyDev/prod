"""
Scoped dev/test reset for profile, preferences, DocuSign, checklist progress, S3, and connections.

Does not remove the user row, gate roles, or transaction rows.
"""

from __future__ import annotations

import os

from app import db
from app.models import (
    Document,
    DocumentLibraryItem,
    DocusignOAuthToken,
    User,
    UserAgentProfile,
)
from app.services.agent.connection_cleanup import clear_agent_client_connections
from app.services.aggregation.clear_user_preferences import clear_user_preferences
from app.services.auth.user.agreement_cleanup import delete_agreements_for_user
from app.services.auth.user.user_s3_cleanup import (
    collect_user_s3_keys,
    delete_profile_picture_s3_key,
    delete_user_scoped_s3_objects,
)
from app.services.transactions.checklist_progress_reset import clear_checklist_progress_for_user
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, log

VALID_SCOPES = frozenset(
    {
        "profile",
        "preferences",
        "docusign",
        "transaction_steps",
        "s3",
        "connections",
    }
)


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

        if "transaction_steps" in scopes:
            clear_checklist_progress_for_user(uid, user)
            cleared["transaction_steps"] = True

        if "s3" in scopes:
            _reset_s3(uid, user)
            cleared["s3"] = True

        if "connections" in scopes:
            clear_agent_client_connections(uid, user)
            cleared["connections"] = True

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
    profile_picture_key = user.profile_picture
    UserAgentProfile.query.filter_by(user_id=uid).delete(synchronize_session=False)
    user.mls_id = None
    user.public_profile_slug = None
    user.profile_picture = None
    db.session.add(user)
    delete_profile_picture_s3_key(profile_picture_key)


def _reset_preferences(uid: str, user: User) -> None:
    clear_user_preferences(uid, user=user)


def _reset_docusign(uid: str) -> None:
    DocusignOAuthToken.query.filter_by(user_id=uid).delete(synchronize_session=False)
    delete_agreements_for_user(uid)


def _reset_s3(uid: str, user: User) -> None:
    extra_keys = collect_user_s3_keys(uid, user=user)
    for doc in Document.query.filter_by(user_id=uid).all():
        li_id = doc.library_item_id
        db.session.delete(doc)
        if li_id:
            li = get_model(DocumentLibraryItem, li_id)
            if li:
                db.session.delete(li)
    delete_user_scoped_s3_objects(uid, extra_s3_keys=extra_keys)
