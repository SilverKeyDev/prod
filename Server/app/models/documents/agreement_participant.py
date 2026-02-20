import uuid

from app import db


class AgreementParticipant(db.Model):
    """Agreement participant - signers and recipients"""

    __tablename__ = "agreement_participants"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agreement_id = db.Column(
        db.String(36), db.ForeignKey("agreements.id"), nullable=False, index=True
    )

    # Participant identity
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=True
    )  # Nullable for external parties
    email = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)

    # Role & routing
    role = db.Column(db.String(50), nullable=False)  # signer, carbon_copy, agent
    routing_order = db.Column(db.Integer, default=1)

    # DocuSign tracking
    docusign_recipient_id = db.Column(db.String(100), nullable=True)
    recipient_status = db.Column(db.String(50), nullable=True)  # sent, delivered, signed, declined

    # Timestamps
    sent_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    signed_at = db.Column(db.DateTime, nullable=True)
    declined_at = db.Column(db.DateTime, nullable=True)

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
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "signed_at": self.signed_at.isoformat() if self.signed_at else None,
            "declined_at": self.declined_at.isoformat() if self.declined_at else None,
        }

    def __repr__(self):
        return f"<AgreementParticipant {self.name} - {self.role}>"
