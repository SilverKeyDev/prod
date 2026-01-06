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
    city = db.Column(db.String(120))
    state = db.Column(db.String(64))
    zipcode = db.Column(db.String(32))

    beds = db.Column(db.String(36))
    baths = db.Column(db.String(36))
    sqft = db.Column(db.String(36))  # maps livingArea
    lot_size = db.Column(db.String(36))  # maps lotAreaValue
    price = db.Column(db.String(36))

    # Media
    image_url = db.Column(db.String(500))  # primary image
    image_urls = db.Column(db.JSON)  # list of additional image URLs

    # Identifiers and metadata
    zpid = db.Column(db.String(64))
    listing_status = db.Column(db.String(64))
    property_type = db.Column(db.String(64))
    home_type = db.Column(db.String(64))
    year_built = db.Column(db.String(16))
    
    # Ranking/Scoring
    score = db.Column(db.Float)

    # Geo
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    # Units and extra numeric descriptors
    living_area = db.Column(db.String(36))  # duplicate of sqft in case of different source
    lot_area_value = db.Column(db.String(36))
    lot_area_unit = db.Column(db.String(32))

    # Enriched data blobs
    features = db.Column(db.JSON)
    property_analysis = db.Column(db.JSON)
    commute_data = db.Column(db.JSON)
    raw_data = db.Column(db.JSON)

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
            "city": self.city,
            "state": self.state,
            "zipcode": self.zipcode,
            "beds": self.beds,
            "baths": self.baths,
            "sqft": self.sqft,
            "lot_size": self.lot_size,
            "price": self.price,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "image_url": self.image_url,
            "image_urls": self.image_urls,
            "zpid": self.zpid,
            "listing_status": self.listing_status,
            "property_type": self.property_type,
            "home_type": self.home_type,
            "year_built": self.year_built,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "living_area": self.living_area,
            "lot_area_value": self.lot_area_value,
            "lot_area_unit": self.lot_area_unit,
            "features": self.features,
            "property_analysis": self.property_analysis,
            "commute_data": self.commute_data,
            "raw_data": self.raw_data,
        }
