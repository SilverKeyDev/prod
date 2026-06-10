# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class GoogleOAuthToken(db.Model):
    """Stores Google OAuth tokens for users"""

    __tablename__ = "user_google_tokens"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )

    # Token data
    access_token: Mapped[str] = mapped_column(db.Text)
    refresh_token: Mapped[str | None] = mapped_column(db.Text)  # May be None if not provided
    token_uri: Mapped[str] = mapped_column(db.String(255))
    client_id: Mapped[str] = mapped_column(db.String(255))
    # client_secret removed - always use config value (same for all users)
    scopes: Mapped[str] = mapped_column(db.Text)  # Space-separated list of scopes
    expiry: Mapped[datetime | None] = mapped_column(db.DateTime)  # Token expiration time

    # Permission flags (boolean fields for each scope)
    has_userinfo_email: Mapped[bool] = mapped_column(default=False)
    has_userinfo_profile: Mapped[bool] = mapped_column(default=False)
    has_openid: Mapped[bool] = mapped_column(default=False)
    has_calendar_freebusy: Mapped[bool] = mapped_column(default=False)
    has_calendar_app_created: Mapped[bool] = mapped_column(default=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="google_oauth_token")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<GoogleOAuthToken user_id={self.user_id}>"
