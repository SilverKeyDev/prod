"""Per-user search UI display settings (map overlay, card count, result ordering)."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app import db

# Keep in sync with Client search display ordering options
RESULTS_ORDER_BY_ALLOWED = frozenset(
    {
        "match_score",
        "price",
        "distance",
        "bedrooms",
        "bathrooms",
        "lot_size",
        "home_age",
    }
)


class UserSearchDisplaySettings(db.Model):
    __tablename__ = "user_search_display"

    user_id: Mapped[str] = mapped_column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    show_commute_overlay: Mapped[bool] = mapped_column(db.Boolean, default=True)
    map_home_cards_count: Mapped[int] = mapped_column(db.Integer, default=1)
    results_order_by: Mapped[str] = mapped_column(db.String(32), default="match_score")
    # When True, preference post-filters always apply. When False, they apply only if the collected
    # pool has more than PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT homes (see polygon_search_post_filters).
    preferences_strict_filter: Mapped[bool] = mapped_column(
        db.Boolean, default=False, server_default=db.text("false")
    )
    # Snapshot of the last executed search: polygon ring, place label, map camera, search source.
    # JSONB so new fields can be added without migrations.
    last_search_context: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB().with_variant(db.JSON, "sqlite"), nullable=True, default=None
    )
    created_at: Mapped[datetime | None] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship(
        "User", backref=db.backref("user_search_display", uselist=False, lazy="select")
    )
