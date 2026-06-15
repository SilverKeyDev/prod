"""Shared property analysis section — one row per (property, section_name)."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class PropertyAnalysisSection(db.Model):
    """A single factual analysis section cached for a property.

    Sections are generated WITHOUT user preferences so they can be reused across
    all users.  Each section has its own TTL via *generated_at*.

    Typical section_name values: ``affordability``, ``neighborhood``,
    ``family_friendly``, ``entertainment``, ``investment``,
    ``climate_environmental_safety``, ``convenience_walkability``, ``commute``.
    """

    __tablename__ = "property_analysis_section"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    property_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("property_cache.id"), nullable=False, index=True
    )
    section_name: Mapped[str] = mapped_column(db.String(100), nullable=False)
    data: Mapped[dict[str, Any] | None] = mapped_column(db.JSON)
    generated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("property_id", "section_name", name="uq_property_section"),
    )

    property: Mapped["PropertyCache"] = relationship(
        "PropertyCache",
        back_populates="analysis_sections",
        lazy="select",
    )
