"""UserAgentProfile - agent-specific profile fields (license, brokerage, etc.)."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class UserAgentProfile(db.Model):
    """Agent profile - license info, brokerage, bio, etc."""

    __tablename__ = "user_agent_profiles"

    user_id: Mapped[str] = mapped_column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    physical_mailing_address: Mapped[str | None] = mapped_column(db.Text)
    licensed_states: Mapped[str | None] = mapped_column(db.Text)  # JSON array
    license_types: Mapped[str | None] = mapped_column(db.Text)  # JSON array
    license_numbers: Mapped[str | None] = mapped_column(db.Text)  # JSON array
    license_expiration_dates: Mapped[str | None] = mapped_column(db.Text)  # JSON array
    mls_affiliations: Mapped[str | None] = mapped_column(db.Text)  # JSON
    brokerage_name: Mapped[str | None] = mapped_column(db.String(255))
    brokerage_bic_name: Mapped[str | None] = mapped_column(db.String(255))
    brokerage_address: Mapped[str | None] = mapped_column(db.Text)
    brokerage_email: Mapped[str | None] = mapped_column(db.String(255))
    brokerage_phone: Mapped[str | None] = mapped_column(db.String(50))
    professional_headshot_url: Mapped[str | None] = mapped_column(db.String(512))
    agent_bio: Mapped[str | None] = mapped_column(db.Text)
    primary_service_zips: Mapped[str | None] = mapped_column(db.Text)  # JSON array
    specialties: Mapped[str | None] = mapped_column(db.Text)  # JSON array
    social_links: Mapped[str | None] = mapped_column(db.Text)  # JSON object
    testimonials: Mapped[str | None] = mapped_column(db.Text)  # JSON array of objects
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="user_agent_profile")
