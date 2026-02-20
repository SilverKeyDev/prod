import uuid
from datetime import datetime, timezone

from app import db


class DocusignConnectEvent(db.Model):
    """DocuSign Connect webhook event - raw webhook storage"""

    __tablename__ = "docusign_connect_events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Idempotency key
    envelope_id = db.Column(db.String(100), nullable=False, index=True)
    event_type = db.Column(db.String(50), nullable=False)
    event_timestamp = db.Column(db.DateTime, nullable=False)

    # Raw payload
    payload = db.Column(db.Text, nullable=False)  # JSON (encrypt in production)

    # Processing
    processed = db.Column(db.Boolean, default=False)
    processed_at = db.Column(db.DateTime, nullable=True)
    processing_error = db.Column(db.Text, nullable=True)
    retry_count = db.Column(db.Integer, default=0)

    # Verification
    hmac_verified = db.Column(db.Boolean, default=False)

    # Timestamps
    received_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Unique constraint for idempotency
    __table_args__ = (
        db.Index(
            "idx_envelope_event_time", "envelope_id", "event_type", "event_timestamp", unique=True
        ),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "envelope_id": self.envelope_id,
            "event_type": self.event_type,
            "event_timestamp": self.event_timestamp.isoformat() if self.event_timestamp else None,
            "processed": self.processed,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "processing_error": self.processing_error,
            "retry_count": self.retry_count,
            "hmac_verified": self.hmac_verified,
            "received_at": self.received_at.isoformat() if self.received_at else None,
        }

    def __repr__(self):
        return f"<DocusignConnectEvent {self.envelope_id} - {self.event_type}>"
