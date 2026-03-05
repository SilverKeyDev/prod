"""Comment on a feed reel item keyed by home_id. Requires migration to create home_comments table."""

import uuid
from datetime import datetime

from app import db


class HomeComment(db.Model):
    """Comment on a feed listing (reel) keyed by home_id."""

    __tablename__ = "home_comments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    home_id = db.Column(db.String(64), nullable=False, index=True)
    user_id = db.Column(db.String(36), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "home_id": self.home_id,
            "user_id": self.user_id,
            "text": self.text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
