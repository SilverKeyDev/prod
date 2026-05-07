"""
Hard-delete a user and all application rows that reference them.

Intended for admin / support / local dev. Irreversible: also removes agreements and
transactions where this user is a party (affects the counterparty's records).

Usage (Flask shell):

    from app.services.auth.user.delete_user import delete_user_and_all_related_data
    delete_user_and_all_related_data("uuid-here")
"""

from __future__ import annotations

import json

from sqlalchemy import or_

from app import db
from app.models import (
    AgentConnectionRequest,
    AgentConnections,
    Agreement,
    AgreementEvent,
    AgreementLink,
    AgreementParticipant,
    AgreementRevision,
    CalendarEvent,
    CalendarShare,
    ChatHistory,
    Document,
    DocumentLibraryItem,
    GoogleOAuthToken,
    HomeComment,
    HomeLikes,
    HomeNotInterested,
    OAuthState,
    ReelLike,
    ScoringResultsTracker,
    Search,
    Todo,
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
from logger import LOG_CATEGORIES, log


def _strip_id_from_user_list_field(raw: str | None, deleted_id: str) -> tuple[str | None, bool]:
    """Parse legacy client_ids / agent_id text; remove deleted_id. Returns (new_value, changed)."""
    if not raw or not str(raw).strip():
        return raw, False
    s = str(raw).strip()
    ids: list[str] = []
    used_json = False
    try:
        parsed = json.loads(s)
        if isinstance(parsed, list):
            ids = [str(x) for x in parsed]
            used_json = True
        elif parsed is not None and parsed != "":
            ids = [str(parsed)]
            used_json = True
    except (json.JSONDecodeError, TypeError):
        ids = [p.strip() for p in s.split(",") if p.strip()]
    before = len(ids)
    ids = [x for x in ids if x != deleted_id]
    if len(ids) == before:
        return raw, False
    if not ids:
        return None, True
    return (json.dumps(ids) if used_json else ",".join(ids), True)


def _remove_deleted_user_from_peer_legacy_fields(deleted_id: str) -> None:
    for peer in User.query.filter(User.id != deleted_id).all():
        changed = False
        new_c, ch = _strip_id_from_user_list_field(peer.client_ids, deleted_id)
        if ch:
            peer.client_ids = new_c
            changed = True
        new_a, ch = _strip_id_from_user_list_field(peer.agent_id, deleted_id)
        if ch:
            peer.agent_id = new_a
            changed = True
        if changed:
            db.session.add(peer)


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

    try:
        AgentConnectionRequest.query.filter(
            or_(
                AgentConnectionRequest.agent_id == uid,
                AgentConnectionRequest.client_id == uid,
            )
        ).delete(synchronize_session=False)

        conv_ids = [
            row[0]
            for row in db.session.query(AgentConnections.id).filter(
                or_(AgentConnections.agent_id == uid, AgentConnections.client_id == uid)
            )
        ]
        if conv_ids:
            ChatHistory.query.filter(ChatHistory.conversation_id.in_(conv_ids)).delete(
                synchronize_session=False
            )
            AgentConnections.query.filter(AgentConnections.id.in_(conv_ids)).delete(
                synchronize_session=False
            )

        Todo.query.filter(or_(Todo.agent_id == uid, Todo.client_id == uid)).delete(
            synchronize_session=False
        )

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
                li = DocumentLibraryItem.query.get(li_id)
                if li:
                    db.session.delete(li)

        agreements = Agreement.query.filter(
            or_(Agreement.agent_id == uid, Agreement.buyer_id == uid)
        ).all()
        if agreements:
            aid_list = [a.id for a in agreements]
            AgreementLink.query.filter(AgreementLink.agreement_id.in_(aid_list)).delete(
                synchronize_session=False
            )
            for ag in agreements:
                li_id = ag.library_item_id
                db.session.delete(ag)
                if li_id:
                    li = DocumentLibraryItem.query.get(li_id)
                    if li:
                        db.session.delete(li)

        # Clear user FKs on agreement rows we are not removing (participant / audit only).
        AgreementParticipant.query.filter(AgreementParticipant.user_id == uid).update(
            {AgreementParticipant.user_id: None},
            synchronize_session=False,
        )
        AgreementEvent.query.filter(AgreementEvent.actor_id == uid).update(
            {AgreementEvent.actor_id: None},
            synchronize_session=False,
        )
        for rev in AgreementRevision.query.filter_by(created_by=uid).all():
            ag = Agreement.query.filter_by(id=rev.agreement_id).one_or_none()
            if ag is not None:
                rev.created_by = ag.agent_id
            else:
                db.session.delete(rev)

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

        GoogleOAuthToken.query.filter_by(user_id=uid).delete(synchronize_session=False)

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

        _remove_deleted_user_from_peer_legacy_fields(uid)

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
