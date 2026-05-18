import uuid
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column

from app import db
from app.utils.format.datetime import to_aware_utc_iso


class AgreementParticipant(db.Model):
    """Agreement participant - signers and recipients"""

    __tablename__ = "agreement_participants"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agreement_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("agreements.id"), index=True
    )

    # Participant identity
    user_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id")
    )  # Nullable for external parties
    email: Mapped[str] = mapped_column(db.String(255))
    name: Mapped[str] = mapped_column(db.String(255))

    # Role & routing
    role: Mapped[str] = mapped_column(db.String(50))  # signer, carbon_copy, agent
    routing_order: Mapped[int | None] = mapped_column(db.Integer, default=1)

    # DocuSign tracking
    docusign_recipient_id: Mapped[str | None] = mapped_column(db.String(100))
    recipient_status: Mapped[str | None] = mapped_column(
        db.String(50)
    )  # sent, delivered, signed, declined

    # Timestamps
    sent_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))
    signed_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))
    declined_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))

    # Relationships
    agreement = db.relationship(
        "Agreement", back_populates="participants", foreign_keys=[agreement_id]
    )
    user = db.relationship("User", foreign_keys=[user_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "agreement_id": self.agreement_id,
            "user_id": self.user_id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "routing_order": self.routing_order,
            "docusign_recipient_id": self.docusign_recipient_id,
            "recipient_status": self.recipient_status,
            "sent_at": to_aware_utc_iso(self.sent_at),
            "delivered_at": to_aware_utc_iso(self.delivered_at),
            "signed_at": to_aware_utc_iso(self.signed_at),
            "declined_at": to_aware_utc_iso(self.declined_at),
        }

    def __repr__(self):
        return f"<AgreementParticipant {self.name} - {self.role}>"
