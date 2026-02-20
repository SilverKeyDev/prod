"""Queryable lists: must_have, deal_breaker, nice_to_have, listing_type, feature. Indexes: (user_id, attribute_type), (attribute_type, attribute_key)."""

import uuid
from datetime import datetime

from app import db


class UserIntentAttribute(db.Model):
    __tablename__ = "user_intent_attributes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    attribute_type = db.Column(
        db.String(50), nullable=False
    )  # must_have, deal_breaker, nice_to_have, listing_type, feature
    attribute_key = db.Column(
        db.String(100), nullable=False
    )  # pool, waterfront, garage, new_construction, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("user_intent_attributes", lazy="dynamic"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
