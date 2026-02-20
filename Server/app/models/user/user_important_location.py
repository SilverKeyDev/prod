"""Important locations (structured, geo-ready). Replaces important_locations JSON. lat/lng nullable for later geocoding."""

import uuid
from datetime import datetime

from app import db


class UserImportantLocation(db.Model):
    __tablename__ = "user_important_locations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    label = db.Column(db.String(100), nullable=True)  # work, gym, partner, etc.
    address = db.Column(db.String(500), nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    max_commute_minutes = db.Column(db.Integer, nullable=True)
    commute_mode = db.Column(db.String(20), nullable=True)  # drive, transit, bike
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("user_important_locations", lazy="dynamic"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
