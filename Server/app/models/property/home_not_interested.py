from datetime import datetime
import uuid
from app import db

class HomeNotInterested(db.Model):
    """Represents a residential property with not interested/undo history tracking."""

    __tablename__ = "home_not_interested"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    is_not_interested = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text('false'))

    # Not interested/undo history - array of timestamps when marked/undone
    not_interested_history = db.Column(db.JSON, default=list)  # Array of {"timestamp": "...", "action": "not_interested"|"undo", "why": "..."}

    # Reason why not interested (optional)
    why = db.Column(db.String(500))  # Reason selected or custom text

    # Basic address and summary fields
    address = db.Column(db.String(500))

    # Identifiers and metadata
    zpid = db.Column(db.String(64))
    mls_home_id = db.Column(db.String(64))
    
    # Ranking/Scoring
    score = db.Column(db.Float)

    # Geo
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super(HomeNotInterested, self).__init__(**kwargs)
        if self.not_interested_history is None:
            self.not_interested_history = []

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "address": self.address,
            "isNotInterested": self.is_not_interested,
            "not_interested_history": self.not_interested_history,
            "why": self.why,
            "score": self.score,
           
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,

            "zpid": self.zpid,
            "mls_home_id": self.mls_home_id,
            
            "latitude": self.latitude,
            "longitude": self.longitude,
        }
