import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

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
    # Legacy columns on user_google_tokens; no longer granted or updated from scope strings.
    has_calendar_calendarlist_readonly: Mapped[bool] = mapped_column(default=False)
    has_calendar_events_freebusy: Mapped[bool] = mapped_column(default=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationship
    user = db.relationship(
        "User", backref=db.backref("google_oauth_token", uselist=False, lazy="select")
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        """Convert to dictionary format expected by token service"""
        return {
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "token_uri": self.token_uri,
            "client_id": self.client_id,
            # client_secret removed - always use config value
            "scopes": self.scopes,
            "expiry": self.expiry,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            # Permission flags
            "has_userinfo_email": self.has_userinfo_email,
            "has_userinfo_profile": self.has_userinfo_profile,
            "has_openid": self.has_openid,
            "has_calendar_freebusy": self.has_calendar_freebusy,
            "has_calendar_app_created": self.has_calendar_app_created,
            "has_calendar_calendarlist_readonly": self.has_calendar_calendarlist_readonly,
            "has_calendar_events_freebusy": self.has_calendar_events_freebusy,
        }

    def __repr__(self):
        return f"<GoogleOAuthToken user_id={self.user_id}>"
