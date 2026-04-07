"""Search intent (changes often; drives ranking).

Typed columns for common filters; ``extended_buyer_preferences`` holds versioned JSON (v1) for
additional buyer dimensions. Requires a DB migration adding ``extended_buyer_preferences`` and
``listing_status`` when deploying (agents do not commit Alembic files in this workflow).
"""

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserSearchIntent(db.Model):
    __tablename__ = "user_search_intent"

    user_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), primary_key=True
    )
    housing_type: Mapped[str | None] = mapped_column(db.String(100))
    preferred_bedrooms_min: Mapped[int | None] = mapped_column(db.Integer)
    preferred_bedrooms_max: Mapped[int | None] = mapped_column(db.Integer)
    preferred_bathrooms_min: Mapped[int | None] = mapped_column(db.Integer)
    preferred_bathrooms_max: Mapped[int | None] = mapped_column(db.Integer)
    preferred_sqft_min: Mapped[int | None] = mapped_column(db.Integer)
    preferred_sqft_max: Mapped[int | None] = mapped_column(db.Integer)
    preferred_lot_size_min: Mapped[float | None] = mapped_column(db.Float)
    preferred_lot_size_max: Mapped[float | None] = mapped_column(db.Float)
    preferred_home_age_min: Mapped[int | None] = mapped_column(db.Integer)
    preferred_home_age_max: Mapped[int | None] = mapped_column(db.Integer)
    days_on_market_min: Mapped[int | None] = mapped_column(db.Integer)
    days_on_market_max: Mapped[int | None] = mapped_column(db.Integer)
    walkability_importance: Mapped[str | None] = mapped_column(db.String(50))
    listing_status: Mapped[str | None] = mapped_column(db.String(50))
    extended_buyer_preferences: Mapped[Any | None] = mapped_column(db.JSON)
    created_at: Mapped[datetime | None] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship(
        "User", backref=db.backref("user_search_intent", uselist=False, lazy="select")
    )
