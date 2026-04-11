"""TransactionAddress model - user's saved transaction/finding-home address."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class TransactionAddress(db.Model):
    """User's saved address for the 'Finding a home' / transaction step."""

    __tablename__ = "transaction_addresses"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), index=True)
    address: Mapped[str] = mapped_column(db.String(500))
    street: Mapped[str | None] = mapped_column(db.String(255))
    city: Mapped[str | None] = mapped_column(db.String(120))
    state: Mapped[str | None] = mapped_column(db.String(64))
    postal_code: Mapped[str | None] = mapped_column(db.String(32))
    country: Mapped[str | None] = mapped_column(db.String(64))
    place_id: Mapped[str | None] = mapped_column(db.String(255))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
