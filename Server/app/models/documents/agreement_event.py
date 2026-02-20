import uuid
from datetime import datetime, timezone

from app import db


class AgreementEvent(db.Model):
    """Agreement event - audit timeline"""

    __tablename__ = "agreement_events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agreement_id = db.Column(
        db.String(36), db.ForeignKey("agreements.id"), nullable=False, index=True
    )

    # Event details
    event_type = db.Column(
        db.String(50), nullable=False
    )  # revision_created, sent, delivered, signed, completed, voided, etc.
    description = db.Column(db.Text, nullable=False)

    # Context
    actor_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=True
    )  # Who triggered it
    event_metadata = db.Column(db.Text, nullable=True)  # JSON for additional context

    # Timestamp
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

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
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<AgreementEvent {self.event_type} - {self.created_at}>"
