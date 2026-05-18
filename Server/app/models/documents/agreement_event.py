import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db
from app.utils.format.datetime import to_aware_utc_iso


class AgreementEvent(db.Model):
    """Agreement event - audit timeline"""

    __tablename__ = "agreement_events"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agreement_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("agreements.id"), index=True
    )

    # Event details
    event_type: Mapped[str] = mapped_column(
        db.String(50)
    )  # revision_created, sent, delivered, signed, completed, voided, etc.
    description: Mapped[str] = mapped_column(db.Text)

    # Context
    actor_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id")
    )  # Who triggered it
    event_metadata: Mapped[str | None] = mapped_column(db.Text)  # JSON for additional context

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    agreement = db.relationship("Agreement", back_populates="events", foreign_keys=[agreement_id])
    actor = db.relationship("User", foreign_keys=[actor_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "agreement_id": self.agreement_id,
            "event_type": self.event_type,
            "description": self.description,
            "actor_id": self.actor_id,
            "metadata": self.event_metadata,
            "created_at": to_aware_utc_iso(self.created_at),
        }

    def __repr__(self):
        return f"<AgreementEvent {self.event_type} - {self.created_at}>"
