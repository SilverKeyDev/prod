"""AgreementLink model - links agreements to transactions and checklist items."""

import uuid

from app import db


class AgreementLink(db.Model):
    """Links an Agreement to a Transaction and optional checklist item."""

    __tablename__ = "agreement_links"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(36), nullable=False, index=True)
    agreement_id = db.Column(
        db.String(36), db.ForeignKey("agreements.id"), nullable=False, index=True
    )
    linked_item_type = db.Column(db.String(50), nullable=False)  # e.g. "checklist_item"
    linked_item_id = db.Column(db.String(100), nullable=False)  # e.g. "escrow.2"

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
