from datetime import datetime
import uuid
from app import db

class HomeUniversal(db.Model):
    """Represents a residential property that can be favourited by users or used elsewhere in the app."""

    __tablename__ = "home_universal"

    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mls_home_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    found_features = db.Column(db.String(500))
    crime_score = db.Column(db.String(36))
    gentrification_score = db.Column(db.String(36))
    vibes = db.Column(db.String(500))
    school_score = db.Column(db.String(500))
    
    

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super(HomeUniversal, self).__init__(**kwargs)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "mls_home_id": self.mls_home_id,
            "found_features": self.found_features,
            "crime_score": self.crime_score,
            "gentrification_score": self.gentrification_score,
            "vibes": self.vibes,
            "school_score": self.school_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
