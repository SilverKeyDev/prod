"""UserAgentProfile - agent-specific profile fields (license, brokerage, etc.)."""

from datetime import datetime, timezone

from app import db


class UserAgentProfile(db.Model):
    """Agent profile - license info, brokerage, bio, etc."""

    __tablename__ = "user_agent_profiles"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    physical_mailing_address = db.Column(db.Text, nullable=True)
    licensed_states = db.Column(db.Text, nullable=True)  # JSON array
    license_types = db.Column(db.Text, nullable=True)  # JSON array
    license_numbers = db.Column(db.Text, nullable=True)  # JSON array
    license_expiration_dates = db.Column(db.Text, nullable=True)  # JSON array
    mls_affiliations = db.Column(db.Text, nullable=True)  # JSON
    brokerage_name = db.Column(db.String(255), nullable=True)
    brokerage_bic_name = db.Column(db.String(255), nullable=True)
    brokerage_address = db.Column(db.Text, nullable=True)
    brokerage_email = db.Column(db.String(255), nullable=True)
    brokerage_phone = db.Column(db.String(50), nullable=True)
    professional_headshot_url = db.Column(db.String(512), nullable=True)
    agent_bio = db.Column(db.Text, nullable=True)
    primary_service_zips = db.Column(db.Text, nullable=True)  # JSON array
    specialties = db.Column(db.Text, nullable=True)  # JSON array
    social_links = db.Column(db.Text, nullable=True)  # JSON object
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship(
        "User", backref=db.backref("user_agent_profile", uselist=False, lazy="select")
    )
