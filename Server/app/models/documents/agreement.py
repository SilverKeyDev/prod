# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, cast

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db

if TYPE_CHECKING:
    from app.models.documents.agreement_revision import AgreementRevision


class Agreement(db.Model):
    """Agreement model - system of record for DocuSign agreements"""

    __tablename__ = "agreements"

    # Core fields
    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    library_item_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("document_library_items.id"), unique=True
    )
    status: Mapped[str] = mapped_column(
        db.String(20), default="draft"
    )  # draft, sent, delivered, signed, completed, voided, declined
    title: Mapped[str] = mapped_column(db.String(255))
    description: Mapped[str | None] = mapped_column(db.Text)

    # Parties and deal spine
    transaction_id: Mapped[str] = mapped_column(
        db.ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    buyer_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))

    # DocuSign integration (nullable until sent)
    docusign_envelope_id: Mapped[str | None] = mapped_column(db.String(100), unique=True)
    docusign_status: Mapped[str | None] = mapped_column(db.String(50))  # Raw DocuSign status
    docusign_source_template_id: Mapped[str | None] = mapped_column(db.String(100))

    # Metadata
    property_address: Mapped[str | None] = mapped_column(db.Text)
    agreement_type: Mapped[str] = mapped_column(
        db.String(50)
    )  # offer, inspection_contingency, financing, etc.

    # Timestamps (timezone=True aligns ORM with Pydantic AwareDatetime / API)
    created_at: Mapped[datetime] = mapped_column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    sent_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))
    voided_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))

    # S3 paths for completed documents
    signed_document_path: Mapped[str | None] = mapped_column(db.String(512))
    certificate_path: Mapped[str | None] = mapped_column(db.String(512))

    # Relationships
    library_item: Mapped["DocumentLibraryItem | None"] = relationship(
        "DocumentLibraryItem",
        back_populates="agreement",
        foreign_keys=[library_item_id],
    )
    participants: Mapped[list["AgreementParticipant"]] = relationship(
        "AgreementParticipant",
        back_populates="agreement",
        cascade="all, delete-orphan",
        lazy="select",
    )
    events: Mapped[list["AgreementEvent"]] = relationship(
        "AgreementEvent",
        back_populates="agreement",
        cascade="all, delete-orphan",
        order_by="AgreementEvent.created_at.desc()",
        lazy="select",
    )
    revisions: Mapped[list["AgreementRevision"]] = relationship(
        "AgreementRevision",
        back_populates="agreement",
        foreign_keys="AgreementRevision.agreement_id",
        cascade="all, delete-orphan",
        order_by="AgreementRevision.version_number.desc()",
        lazy="select",
    )
    agreement_links: Mapped[list["AgreementLink"]] = relationship(
        "AgreementLink",
        back_populates="agreement",
        lazy="select",
    )

    @property
    def current_revision(self) -> AgreementRevision | None:
        """Latest revision by version_number (derived; no reverse FK)."""
        revisions_list = list(cast(Any, self.revisions)) if self.revisions else []
        if not revisions_list:
            return None
        return max(revisions_list, key=lambda r: r.version_number)

    @property
    def current_revision_id(self) -> str | None:
        """ID of the latest revision, or None."""
        rev = self.current_revision
        return rev.id if rev else None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<Agreement {self.id} - {self.title}>"
