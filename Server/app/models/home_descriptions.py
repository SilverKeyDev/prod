from datetime import datetime
import uuid
from app import db

class HomeDescription(db.Model):
    """Represents a residential property that can be favourited by users or used elsewhere in the app."""

    __tablename__ = "home_descriptions"

    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    home_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_description = db.Column(db.String(500))
    positives = db.Column(db.String(500))
    negatives = db.Column(db.String(500))
    

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super(HomeDescription, self).__init__(**kwargs)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "home_id": self.home_id,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
