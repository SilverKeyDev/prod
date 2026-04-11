"""Queryable lists: must_have, deal_breaker, nice_to_have, listing_type, feature. Indexes: (user_id, attribute_type), (attribute_type, attribute_key)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserIntentAttribute(db.Model):
    __tablename__ = "user_intent_attributes"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    attribute_type: Mapped[str] = mapped_column(
        db.String(50)
    )  # must_have, deal_breaker, nice_to_have, listing_type, feature
    attribute_key: Mapped[str] = mapped_column(
        db.String(100)
    )  # pool, waterfront, garage, new_construction, etc.
    created_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("user_intent_attributes", lazy="dynamic"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
