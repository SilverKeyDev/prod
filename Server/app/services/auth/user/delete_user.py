"""
Hard-delete a user and all application rows that reference them.

Intended for admin / support / local dev. Irreversible: also removes agreements and
transactions where this user is a party (affects the counterparty's records).

Before DB deletion, deletes the Cognito identity, revokes Google Calendar and DocuSign
OAuth, and deletes user-scoped S3 objects.

Usage (Flask shell):

    from app.services.auth.user.delete_user import delete_user_and_all_related_data
    delete_user_and_all_related_data("uuid-here")
"""

from __future__ import annotations

from sqlalchemy import delete, or_, select

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
    HomeNotInterested,
    OAuthState,
    ReelLike,
    ScoringResultsTracker,
    Transaction,
    TransactionAddress,
    TransactionTask,
    User,
    UserAgentProfile,
    UserClientSettings,
    UserCommunicationPrefs,
    UserDemographics,
    UserFinancials,
    UserImportantLocation,
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
from logger import log


def delete_user_and_all_related_data(user_id: str) -> bool:
    """
    Delete exactly one user row (primary key ``users.id``) and dependent rows.

    Never issues a bulk delete on ``users``; all related deletes are scoped to that id.

    Returns:
        True if a user was found and deleted, False if no such user exists.
    """
    if not user_id or not str(user_id).strip():
        log.warn("API", "delete_user_and_all_related_data: empty user_id")
        return False

    uid = str(user_id).strip()
    user = db.session.scalar(select(User).where(User.id == uid))
    if user is None:
        log.info("API", "delete_user_and_all_related_data: user not found", {})
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
            "ERRORS",
            f"delete_user: external cleanup raised user_id={uid}",
            exc,
        )

    try:
        clear_agent_client_connections(uid, user)

        db.session.execute(
            delete(CalendarShare).where(
                or_(
                    CalendarShare.calendar_owner_id == uid,
                    CalendarShare.shared_with_user_id == uid,
                )
            )
        )

        db.session.execute(
            delete(CalendarEvent).where(
                or_(
                    CalendarEvent.user_id == uid,
                    CalendarEvent.creator_id == uid,
                    CalendarEvent.target_user_id == uid,
                )
            )
        )

        db.session.execute(delete(TransactionTask).where(TransactionTask.user_id == uid))
        db.session.execute(delete(TransactionAddress).where(TransactionAddress.user_id == uid))

        tx_ids = list(
            db.session.scalars(
                select(Transaction.id).where(
                    or_(Transaction.buyer_id == uid, Transaction.primary_agent_id == uid)
                )
            ).all()
        )
        if tx_ids:
            db.session.execute(
                delete(AgreementLink).where(AgreementLink.transaction_id.in_(tx_ids))
            )
            db.session.execute(delete(Transaction).where(Transaction.id.in_(tx_ids)))

        for d in db.session.scalars(select(Document).where(Document.user_id == uid)).all():
            li_id = d.library_item_id
            db.session.delete(d)
            if li_id:
                li = get_model(DocumentLibraryItem, li_id)
                if li:
                    db.session.delete(li)

        delete_agreements_for_user(uid)

        db.session.execute(delete(UserIntentAttribute).where(UserIntentAttribute.user_id == uid))
        db.session.execute(
            delete(UserImportantLocation).where(UserImportantLocation.user_id == uid)
        )
        db.session.execute(delete(UserRole).where(UserRole.user_id == uid))
        db.session.execute(delete(UserFinancials).where(UserFinancials.user_id == uid))
        db.session.execute(delete(UserDemographics).where(UserDemographics.user_id == uid))
        db.session.execute(
            delete(UserCommunicationPrefs).where(UserCommunicationPrefs.user_id == uid)
        )
        db.session.execute(delete(UserSearchIntent).where(UserSearchIntent.user_id == uid))
        db.session.execute(delete(UserAgentProfile).where(UserAgentProfile.user_id == uid))

        # Google/DocuSign tokens removed during external cleanup; delete rows if any remain.
        db.session.execute(delete(GoogleOAuthToken).where(GoogleOAuthToken.user_id == uid))
        db.session.execute(delete(DocusignOAuthToken).where(DocusignOAuthToken.user_id == uid))

        db.session.execute(
            delete(UserPropertyHighlights).where(UserPropertyHighlights.user_id == uid)
        )
        db.session.execute(delete(UserPropertyCommute).where(UserPropertyCommute.user_id == uid))
        db.session.execute(delete(UserPropertyLink).where(UserPropertyLink.user_id == uid))
        db.session.execute(delete(HomeNotInterested).where(HomeNotInterested.user_id == uid))
        db.session.execute(delete(HomeComment).where(HomeComment.user_id == uid))
        db.session.execute(delete(ReelLike).where(ReelLike.user_id == uid))
        db.session.execute(
            delete(ScoringResultsTracker).where(ScoringResultsTracker.user_id == uid)
        )
        db.session.execute(delete(UserScoreWeights).where(UserScoreWeights.user_id == uid))

        db.session.execute(delete(OAuthState).where(OAuthState.user_id == uid))

        db.session.execute(
            delete(ChatHistory).where(or_(ChatHistory.user_id == uid, ChatHistory.sender_id == uid))
        )

        # user_client_settings.user_id is the primary key, so SQLAlchemy cannot
        # null it out via the backref when the User row is deleted. Delete it
        # explicitly before removing the User.
        db.session.execute(delete(UserClientSettings).where(UserClientSettings.user_id == uid))

        db.session.delete(user)
        db.session.commit()
        log.info(
            "API",
            "delete_user_and_all_related_data: user deleted",
            {"user_id": uid},
        )
        return True
    except Exception as exc:
        db.session.rollback()
        log.error(
            "ERRORS",
            f"delete_user_and_all_related_data failed user_id={uid}",
            exc,
        )
        raise
