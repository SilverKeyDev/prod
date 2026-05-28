"""
Hard-delete a user and all application rows that reference them.

Intended for admin / support / local dev. Irreversible: also removes agreements and
transactions where this user is a party (affects the counterparty's records).

Before DB deletion, deletes the Cognito identity, revokes Google Calendar and DocuSign
OAuth, disconnects Plaid when configured, and deletes user-scoped S3 objects.

Usage (Flask shell):

    from app.services.auth.user.delete_user import delete_user_and_all_related_data
    delete_user_and_all_related_data("uuid-here")
"""

from __future__ import annotations

from sqlalchemy import or_

from app import db
from app.models import (
    AgreementLink,
    CalendarEvent,
    CalendarShare,
    ChatHistory,
    Document,
    DocumentLibraryItem,
    DocusignOAuthToken,
    GoogleOAuthToken,
    HomeComment,
    HomeLikes,
    HomeNotInterested,
    OAuthState,
    ReelLike,
    ScoringResultsTracker,
    Search,
    Transaction,
    TransactionAddress,
    TransactionTask,
    User,
    UserAgentProfile,
    UserCalendarConnection,
    UserClientSettings,
    UserCommunicationPrefs,
    UserDemographics,
    UserFinancials,
    UserImportantLocation,
    UserIntegration,
    UserIntentAttribute,
    UserPropertyCommute,
    UserPropertyHighlights,
    UserPropertyLink,
    UserRole,
    UserScoreWeights,
    UserSearchIntent,
)
from app.services.agent.connection_cleanup import clear_agent_client_connections
from app.services.auth.user.agreement_cleanup import delete_agreements_for_user
from app.services.auth.user.delete_user_external_cleanup import (
    cleanup_external_resources_for_user,
)
from app.services.auth.user.user_s3_cleanup import collect_user_s3_keys
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, log


def delete_user_and_all_related_data(user_id: str) -> bool:
    """
    Delete exactly one user row (primary key ``users.id``) and dependent rows.

    Never issues a bulk delete on ``users``; all related deletes are scoped to that id.

    Returns:
        True if a user was found and deleted, False if no such user exists.
    """
    if not user_id or not str(user_id).strip():
        log.warn(LOG_CATEGORIES["API"], "delete_user_and_all_related_data: empty user_id")
        return False

    uid = str(user_id).strip()
    user = User.query.filter_by(id=uid).one_or_none()
    if user is None:
        log.info(LOG_CATEGORIES["API"], "delete_user_and_all_related_data: user not found", {})
        return False

    extra_s3_keys = collect_user_s3_keys(uid, user=user)

    try:
        cleanup_external_resources_for_user(
            uid,
            extra_s3_keys=extra_s3_keys,
            email=user.email,
            cognito_id=user.cognito_id,
        )
    except Exception as exc:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            f"delete_user: external cleanup raised user_id={uid}",
            exc,
        )

    try:
        clear_agent_client_connections(uid, user)

        CalendarShare.query.filter(
            or_(
                CalendarShare.calendar_owner_id == uid,
                CalendarShare.shared_with_user_id == uid,
            )
        ).delete(synchronize_session=False)

        CalendarEvent.query.filter(
            or_(
                CalendarEvent.user_id == uid,
                CalendarEvent.creator_id == uid,
                CalendarEvent.target_user_id == uid,
            )
        ).delete(synchronize_session=False)

        TransactionTask.query.filter_by(user_id=uid).delete(synchronize_session=False)
        TransactionAddress.query.filter_by(user_id=uid).delete(synchronize_session=False)

        tx_ids = [
            row[0]
            for row in db.session.query(Transaction.id).filter(
                or_(Transaction.buyer_id == uid, Transaction.primary_agent_id == uid)
            )
        ]
        if tx_ids:
            AgreementLink.query.filter(AgreementLink.transaction_id.in_(tx_ids)).delete(
                synchronize_session=False
            )
            Transaction.query.filter(Transaction.id.in_(tx_ids)).delete(synchronize_session=False)

        for d in Document.query.filter_by(user_id=uid).all():
            li_id = d.library_item_id
            db.session.delete(d)
            if li_id:
                li = get_model(DocumentLibraryItem, li_id)
                if li:
                    db.session.delete(li)

        delete_agreements_for_user(uid)

        Search.query.filter_by(user_id=uid).delete(synchronize_session=False)

        UserIntentAttribute.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserImportantLocation.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserRole.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserFinancials.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserDemographics.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserCommunicationPrefs.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserSearchIntent.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserCalendarConnection.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserAgentProfile.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserIntegration.query.filter_by(user_id=uid).delete(synchronize_session=False)

        # Google/DocuSign tokens removed during external cleanup; delete rows if any remain.
        GoogleOAuthToken.query.filter_by(user_id=uid).delete(synchronize_session=False)
        DocusignOAuthToken.query.filter_by(user_id=uid).delete(synchronize_session=False)

        UserPropertyHighlights.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserPropertyCommute.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserPropertyLink.query.filter_by(user_id=uid).delete(synchronize_session=False)
        HomeLikes.query.filter_by(user_id=uid).delete(synchronize_session=False)
        HomeNotInterested.query.filter_by(user_id=uid).delete(synchronize_session=False)
        HomeComment.query.filter_by(user_id=uid).delete(synchronize_session=False)
        ReelLike.query.filter_by(user_id=uid).delete(synchronize_session=False)
        ScoringResultsTracker.query.filter_by(user_id=uid).delete(synchronize_session=False)
        UserScoreWeights.query.filter_by(user_id=uid).delete(synchronize_session=False)

        OAuthState.query.filter_by(user_id=uid).delete(synchronize_session=False)

        ChatHistory.query.filter(
            or_(ChatHistory.user_id == uid, ChatHistory.sender_id == uid)
        ).delete(synchronize_session=False)

        # user_client_settings.user_id is the primary key, so SQLAlchemy cannot
        # null it out via the backref when the User row is deleted. Delete it
        # explicitly before removing the User.
        UserClientSettings.query.filter_by(user_id=uid).delete(synchronize_session=False)

        db.session.delete(user)
        db.session.commit()
        log.info(
            LOG_CATEGORIES["API"],
            "delete_user_and_all_related_data: user deleted",
            {"user_id": uid},
        )
        return True
    except Exception as exc:
        db.session.rollback()
        log.error(
            LOG_CATEGORIES["ERRORS"],
            f"delete_user_and_all_related_data failed user_id={uid}",
            exc,
        )
        raise
