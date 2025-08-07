from datetime import datetime
import uuid
from app import db

class Home(db.Model):
    """Represents a residential property that can be favourited by users or used elsewhere in the app."""

    __tablename__ = "homes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # Basic facts
    address_line = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)

    price = db.Column(db.Numeric(precision=12, scale=2))  # e.g. 9999999.99
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Float)  # allow half baths e.g 1.5
    square_feet = db.Column(db.Integer)
    lot_size_sqft = db.Column(db.Integer)
    year_built = db.Column(db.Integer)
    property_type = db.Column(db.String(100))  # e.g. Single Family, Condo, etc.

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    listing_url = db.Column(db.String(500))
    image_url = db.Column(db.String(500))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super(Home, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "address_line": self.address_line,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "price": str(self.price) if self.price is not None else None,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "square_feet": self.square_feet,
            "lot_size_sqft": self.lot_size_sqft,
            "year_built": self.year_built,
            "property_type": self.property_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "listing_url": self.listing_url,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
