import uuid
import warnings
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class HomeUniversal(db.Model):
    """Represents a residential property that can be favourited by users or used elsewhere in the app."""

    __tablename__ = "home_universal"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36))
    is_liked: Mapped[bool] = mapped_column(
        db.Boolean, default=False, server_default=db.text("false")
    )
    current: Mapped[bool] = mapped_column(db.Boolean, default=True, server_default=db.text("true"))

    # Basic address and summary fields
    address: Mapped[str | None] = mapped_column(db.String(500))
    city: Mapped[str | None] = mapped_column(db.String(120))
    state: Mapped[str | None] = mapped_column(db.String(64))
    zipcode: Mapped[str | None] = mapped_column(db.String(32))

    beds: Mapped[str | None] = mapped_column(db.String(36))
    baths: Mapped[str | None] = mapped_column(db.String(36))
    sqft: Mapped[str | None] = mapped_column(db.String(36))  # maps livingArea
    lot_size: Mapped[str | None] = mapped_column(db.String(36))  # maps lotAreaValue
    price: Mapped[str | None] = mapped_column(db.String(36))

    # Media
    image_url: Mapped[str | None] = mapped_column(db.String(500))  # primary image
    image_urls: Mapped[dict[str, Any] | None] = mapped_column(
        db.JSON
    )  # list of additional image URLs

    # Identifiers and metadata
    zpid: Mapped[str | None] = mapped_column(db.String(64))
    mls_home_id: Mapped[str | None] = mapped_column(db.String(64))
    listing_status: Mapped[str | None] = mapped_column(db.String(64))
    property_type: Mapped[str | None] = mapped_column(db.String(64))
    home_type: Mapped[str | None] = mapped_column(db.String(64))
    year_built: Mapped[str | None] = mapped_column(db.String(16))

    # MLS and Agent Information
    mls_agent_id: Mapped[str | None] = mapped_column(db.String(64))
    listing_agent_phone: Mapped[str | None] = mapped_column(db.String(32))
    listing_agent_email: Mapped[str | None] = mapped_column(db.String(255))
    brokerage: Mapped[str | None] = mapped_column(db.String(255))
    mls_region: Mapped[str | None] = mapped_column(db.String(64))

    # Ranking/Scoring
    score: Mapped[float | None] = mapped_column(db.Float)
    ranking: Mapped[int | None] = mapped_column(
        db.Integer
    )  # Position in search results (1-based, 1 = best/highest score)

    # Geo
    latitude: Mapped[float | None] = mapped_column(db.Float)
    longitude: Mapped[float | None] = mapped_column(db.Float)

    # Units and extra numeric descriptors
    living_area: Mapped[str | None] = mapped_column(
        db.String(36)
    )  # duplicate of sqft in case of different source
    lot_area_value: Mapped[str | None] = mapped_column(db.String(36))
    lot_area_unit: Mapped[str | None] = mapped_column(db.String(32))

    # Enriched data blobs
    features: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    property_analysis: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    commute_data: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    raw_data: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)

    created_at: Mapped[datetime | None] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime | None] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        warnings.warn(
            "HomeUniversal.to_dict() is deprecated; use app.dtos.saved_home.SavedHomeDTO.from_orm",
            DeprecationWarning,
            stacklevel=2,
        )
        return {
            "id": self.id,
            "user_id": self.user_id,
            "address": self.address,
            "isLiked": self.is_liked,
            "current": self.current,
            "score": self.score,
            "ranking": self.ranking,
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
            "mls_home_id": self.mls_home_id,
            "listing_status": self.listing_status,
            "property_type": self.property_type,
            "home_type": self.home_type,
            "year_built": self.year_built,
            "mls_agent_id": self.mls_agent_id,
            "listing_agent_phone": self.listing_agent_phone,
            "listing_agent_email": self.listing_agent_email,
            "brokerage": self.brokerage,
            "mls_region": self.mls_region,
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
