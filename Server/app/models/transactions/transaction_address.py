"""TransactionAddress model - user's saved transaction/finding-home address."""

import uuid
from datetime import datetime, timezone

from app import db


class TransactionAddress(db.Model):
    """User's saved address for the 'Finding a home' / transaction step."""

    __tablename__ = "transaction_addresses"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    address = db.Column(db.String(500), nullable=False)
    street = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(120), nullable=True)
    state = db.Column(db.String(64), nullable=True)
    postal_code = db.Column(db.String(32), nullable=True)
    country = db.Column(db.String(64), nullable=True)
    place_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
