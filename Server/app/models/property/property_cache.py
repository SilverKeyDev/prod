"""Shared property cache — one row per physical property, no user_id."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class PropertyCache(db.Model):
    """Canonical shared property record.

    Unlike HomeUniversal (per-user), PropertyCache stores exactly one row per
    physical property identified by *zpid* or *address_normalized*.  Shared data
    (images, listing features, image features, raw API data) lives here so that
    any user viewing the same property benefits from cached API results.
    """

    __tablename__ = "property_cache"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Unique identifiers — either may be used for look-ups
    zpid: Mapped[str | None] = mapped_column(db.String(64), unique=True, index=True)
    address_normalized: Mapped[str | None] = mapped_column(db.String(500), unique=True, index=True)

    # Human-readable address parts
    address: Mapped[str | None] = mapped_column(db.String(500))
    city: Mapped[str | None] = mapped_column(db.String(120))
    state: Mapped[str | None] = mapped_column(db.String(64))
    zipcode: Mapped[str | None] = mapped_column(db.String(32))

    # Basic listing fields
    beds: Mapped[str | None] = mapped_column(db.String(36))
    baths: Mapped[str | None] = mapped_column(db.String(36))
    sqft: Mapped[str | None] = mapped_column(db.String(36))
    lot_size: Mapped[str | None] = mapped_column(db.String(36))

    # Price — stored for reference but always refreshed on view
    price: Mapped[str | None] = mapped_column(db.String(36))
    price_updated_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))

    # Geo
    latitude: Mapped[float | None] = mapped_column(db.Float)
    longitude: Mapped[float | None] = mapped_column(db.Float)

    # Media (shared across users)
    primary_image_url: Mapped[str | None] = mapped_column(db.String(500))
    images: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    images_fetched_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))

    # Features
    listing_features: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    image_features: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    image_features_generated_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))

    # Identifiers / metadata
    mls_home_id: Mapped[str | None] = mapped_column(db.String(64))
    listing_status: Mapped[str | None] = mapped_column(db.String(64))
    property_type: Mapped[str | None] = mapped_column(db.String(64))
    home_type: Mapped[str | None] = mapped_column(db.String(64))
    year_built: Mapped[str | None] = mapped_column(db.String(16))

    # MLS / Agent info
    mls_agent_id: Mapped[str | None] = mapped_column(db.String(64))
    listing_agent_phone: Mapped[str | None] = mapped_column(db.String(32))
    listing_agent_email: Mapped[str | None] = mapped_column(db.String(255))
    brokerage: Mapped[str | None] = mapped_column(db.String(255))
    mls_region: Mapped[str | None] = mapped_column(db.String(64))

    # Extra numeric descriptors
    living_area: Mapped[str | None] = mapped_column(db.String(36))
    lot_area_value: Mapped[str | None] = mapped_column(db.String(36))
    lot_area_unit: Mapped[str | None] = mapped_column(db.String(32))

    # Full API response blob
    raw_data: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    basic_data_updated_at: Mapped[datetime | None] = mapped_column(db.DateTime(timezone=True))

    created_at: Mapped[datetime | None] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime | None] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships (loaded lazily to avoid import cycles)
    analysis_sections = db.relationship(
        "PropertyAnalysisSection",
        backref=db.backref("property", lazy="select"),
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    user_highlights = db.relationship(
        "UserPropertyHighlights",
        backref=db.backref("property", lazy="select"),
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    user_commutes = db.relationship(
        "UserPropertyCommute",
        backref=db.backref("property", lazy="select"),
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    user_links = db.relationship(
        "UserPropertyLink",
        backref=db.backref("property", lazy="select"),
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
