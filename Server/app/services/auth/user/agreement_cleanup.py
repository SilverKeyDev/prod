"""Delete DocuSign agreements and related rows for a user (agent or buyer party)."""

from __future__ import annotations

from sqlalchemy import delete, or_, select, update

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
    agreements = db.session.scalars(
        select(Agreement).where(or_(Agreement.agent_id == uid, Agreement.buyer_id == uid))
    ).all()
    if agreements:
        aid_list = [a.id for a in agreements]
        db.session.execute(delete(AgreementLink).where(AgreementLink.agreement_id.in_(aid_list)))
        for ag in agreements:
            li_id = ag.library_item_id
            db.session.delete(ag)
            if li_id:
                li = get_model(DocumentLibraryItem, li_id)
                if li:
                    db.session.delete(li)

    db.session.execute(
        update(AgreementParticipant).where(AgreementParticipant.user_id == uid).values(user_id=None)
    )
    db.session.execute(
        update(AgreementEvent).where(AgreementEvent.actor_id == uid).values(actor_id=None)
    )
    for rev in db.session.scalars(
        select(AgreementRevision).where(AgreementRevision.created_by == uid)
    ).all():
        ag = db.session.scalar(select(Agreement).where(Agreement.id == rev.agreement_id))
        if ag is not None:
            rev.created_by = ag.agent_id
        else:
            db.session.delete(rev)
