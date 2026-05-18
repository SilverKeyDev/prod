"""Delete DocuSign agreements and related rows for a user (agent or buyer party)."""

from __future__ import annotations

from sqlalchemy import or_

from app import db
from app.models import (
    Agreement,
    AgreementEvent,
    AgreementLink,
    AgreementParticipant,
    AgreementRevision,
    DocumentLibraryItem,
)
from app.utils.db.orm_lookup import get_model


def delete_agreements_for_user(user_id: str) -> None:
    """
    Remove agreements where the user is agent or buyer, plus linked library items.

    Clears participant/event FKs on agreements we keep; reassigns or drops revisions
    created by this user when the parent agreement remains.
    """
    uid = str(user_id).strip()
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
                li = get_model(DocumentLibraryItem, li_id)
                if li:
                    db.session.delete(li)

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
