"""AgreementLink model - links agreements to transactions and checklist items."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class AgreementLink(db.Model):
    """Links an Agreement to a Transaction and optional checklist item."""

    __tablename__ = "agreement_links"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    transaction_id: Mapped[str] = mapped_column(
        db.ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agreement_id: Mapped[str] = mapped_column(db.ForeignKey("agreements.id"), index=True)
    linked_item_type: Mapped[str] = mapped_column(db.String(50))  # e.g. "checklist_item"
    linked_item_id: Mapped[str] = mapped_column(db.String(100))  # e.g. "escrow.2"

    agreement: Mapped["Agreement"] = relationship(
        "Agreement",
        back_populates="agreement_links",
        foreign_keys=[agreement_id],
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<AgreementLink {self.transaction_id} -> {self.agreement_id}>"
