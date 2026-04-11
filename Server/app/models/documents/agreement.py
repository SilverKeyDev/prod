from __future__ import annotations

import uuid
import warnings
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, cast

from sqlalchemy.orm import Mapped, mapped_column

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

    # Parties
    agent_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    buyer_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))

    # DocuSign integration (nullable until sent)
    docusign_envelope_id: Mapped[str | None] = mapped_column(db.String(100), unique=True)
    docusign_status: Mapped[str | None] = mapped_column(db.String(50))  # Raw DocuSign status

    # Metadata
    property_address: Mapped[str | None] = mapped_column(db.Text)
    agreement_type: Mapped[str] = mapped_column(
        db.String(50)
    )  # offer, inspection_contingency, financing, etc.

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    sent_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    voided_at: Mapped[datetime | None] = mapped_column(db.DateTime)

    # S3 paths for completed documents
    signed_document_path: Mapped[str | None] = mapped_column(db.String(512))
    certificate_path: Mapped[str | None] = mapped_column(db.String(512))

    # Relationships
    library_item = db.relationship(
        "DocumentLibraryItem",
        back_populates="agreement",
        foreign_keys=[library_item_id],
    )
    participants = db.relationship(
        "AgreementParticipant",
        back_populates="agreement",
        cascade="all, delete-orphan",
        lazy="select",
    )
    events = db.relationship(
        "AgreementEvent",
        back_populates="agreement",
        cascade="all, delete-orphan",
        order_by="AgreementEvent.created_at.desc()",
        lazy="select",
    )
    revisions = db.relationship(
        "AgreementRevision",
        back_populates="agreement",
        foreign_keys="AgreementRevision.agreement_id",
        cascade="all, delete-orphan",
        order_by="AgreementRevision.version_number.desc()",
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

    def to_dict(self, include_relationships=False):
        warnings.warn(
            "Agreement.to_dict() is deprecated; use app.dtos.agreement.AgreementDTO.from_orm",
            DeprecationWarning,
            stacklevel=2,
        )
        result = {
            "id": self.id,
            "status": self.status,
            "title": self.title,
            "description": self.description,
            "agent_id": self.agent_id,
            "buyer_id": self.buyer_id,
            "current_revision_id": self.current_revision_id,  # derived from latest revision
            "docusign_envelope_id": self.docusign_envelope_id,
            "docusign_status": self.docusign_status,
            "property_address": self.property_address,
            "agreement_type": self.agreement_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "voided_at": self.voided_at.isoformat() if self.voided_at else None,
            "signed_document_path": self.signed_document_path,
            "certificate_path": self.certificate_path,
        }

        if include_relationships:
            result["participants"] = (
                [p.to_dict() for p in list(cast(Any, self.participants))]
                if hasattr(self, "participants")
                else []
            )
            result["events"] = (
                [e.to_dict() for e in list(cast(Any, self.events))[:10]]
                if hasattr(self, "events")
                else []
            )  # Last 10 events
            cur_rev = self.current_revision
            result["current_revision"] = cur_rev.to_dict() if cur_rev else None

        return result

    def __repr__(self):
        return f"<Agreement {self.id} - {self.title}>"
