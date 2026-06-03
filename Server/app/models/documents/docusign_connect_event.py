# pyright: reportUndefinedVariable=false
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class DocusignConnectEvent(db.Model):
    """DocuSign Connect webhook event - raw webhook storage"""

    __tablename__ = "docusign_connect_events"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Idempotency key
    envelope_id: Mapped[str] = mapped_column(db.String(100), index=True)
    event_type: Mapped[str] = mapped_column(db.String(50))
    event_timestamp: Mapped[datetime] = mapped_column(db.DateTime)

    # Raw payload
    payload: Mapped[str] = mapped_column(db.Text)  # JSON (encrypt in production)

    # Processing
    processed: Mapped[bool] = mapped_column(default=False)
    processed_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    processing_error: Mapped[str | None] = mapped_column(db.Text)
    retry_count: Mapped[int | None] = mapped_column(db.Integer, default=0)

    # Verification
    hmac_verified: Mapped[bool] = mapped_column(default=False)

    # Timestamps
    received_at: Mapped[datetime] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

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

    def __repr__(self):
        return f"<DocusignConnectEvent {self.envelope_id} - {self.event_type}>"
