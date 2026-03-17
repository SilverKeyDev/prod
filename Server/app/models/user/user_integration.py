"""UserIntegration - OAuth tokens and integration state (SkySlope, etc.)."""

import uuid
from datetime import datetime, timezone

from app import db


class UserIntegration(db.Model):
    """User's integration with external providers (SkySlope, etc.)."""

    __tablename__ = "user_integrations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    provider = db.Column(db.String(50), nullable=False, index=True)
    access_token = db.Column(db.Text, nullable=False)
    refresh_token = db.Column(db.Text, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (db.UniqueConstraint("user_id", "provider", name="uq_user_provider"),)
