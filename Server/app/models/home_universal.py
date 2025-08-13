from datetime import datetime
import uuid
from app import db

class HomeUniversal(db.Model):
    """Represents a residential property that can be favourited by users or used elsewhere in the app."""

    __tablename__ = "home_universal"

    user_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    address = db.Column(db.String(500))
    beds = db.Column(db.String(36))
    baths = db.Column(db.String(36))
    sqft = db.Column(db.String(36))
    lot_size = db.Column(db.String(36))
    price = db.Column(db.String(36))    
    image_url = db.Column(db.String(500))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super(HomeUniversal, self).__init__(**kwargs)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "address": self.address,
            "beds": self.beds,
            "baths": self.baths,
            "sqft": self.sqft,
            "lot_size": self.lot_size,
            "price": self.price,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "image_url": self.image_url,
        }
