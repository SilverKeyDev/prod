from datetime import datetime
import uuid
from app import db

class HomeLikes(db.Model):
    """Represents a residential property with like/unlike history tracking."""

    __tablename__ = "home_likes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    is_liked = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text('false'))

    # Like/unlike history - array of timestamps when liked/unliked
    like_history = db.Column(db.JSON, default=list)  # Array of {"timestamp": "...", "action": "liked"|"unliked"}

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
        super(HomeLikes, self).__init__(**kwargs)
        if self.like_history is None:
            self.like_history = []

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "address": self.address,
            "isLiked": self.is_liked,
            "like_history": self.like_history,
            "score": self.score,
           
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,

            "zpid": self.zpid,
            "mls_home_id": self.mls_home_id,
            
            "latitude": self.latitude,
            "longitude": self.longitude,
        }
