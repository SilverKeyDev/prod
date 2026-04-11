"""AgreementLink model - links agreements to transactions and checklist items."""

import uuid

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class AgreementLink(db.Model):
    """Links an Agreement to a Transaction and optional checklist item."""

    __tablename__ = "agreement_links"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    transaction_id: Mapped[str] = mapped_column(db.String(36), index=True)
    agreement_id: Mapped[str] = mapped_column(db.ForeignKey("agreements.id"), index=True)
    linked_item_type: Mapped[str] = mapped_column(db.String(50))  # e.g. "checklist_item"
    linked_item_id: Mapped[str] = mapped_column(db.String(100))  # e.g. "escrow.2"

    # Relationships
    agreement = db.relationship(
        "Agreement",
        backref=db.backref("agreement_links", lazy="select"),
        foreign_keys=[agreement_id],
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<AgreementLink {self.transaction_id} -> {self.agreement_id}>"
