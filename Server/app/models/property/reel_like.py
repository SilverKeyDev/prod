"""Reel/feed like by (user_id, home_id). Requires migration to create reel_likes table."""

import uuid
from datetime import datetime

from app import db


class ReelLike(db.Model):
    """Like on a feed reel item keyed by home_id (listing id)."""

    __tablename__ = "reel_likes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    home_id = db.Column(db.String(64), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "home_id": self.home_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
