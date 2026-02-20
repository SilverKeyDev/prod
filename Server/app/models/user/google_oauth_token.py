import uuid
from datetime import datetime

from app import db


class GoogleOAuthToken(db.Model):
    """Stores Google OAuth tokens for users"""

    __tablename__ = "user_google_tokens"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    # Token data
    access_token = db.Column(db.Text, nullable=False)
    refresh_token = db.Column(db.Text, nullable=True)  # May be None if not provided
    token_uri = db.Column(db.String(255), nullable=False)
    client_id = db.Column(db.String(255), nullable=False)
    # client_secret removed - always use config value (same for all users)
    scopes = db.Column(db.Text, nullable=False)  # Space-separated list of scopes
    expiry = db.Column(db.DateTime, nullable=True)  # Token expiration time

    # Permission flags (boolean fields for each scope)
    has_userinfo_email = db.Column(db.Boolean, default=False, nullable=False)
    has_userinfo_profile = db.Column(db.Boolean, default=False, nullable=False)
    has_openid = db.Column(db.Boolean, default=False, nullable=False)
    has_calendar_freebusy = db.Column(db.Boolean, default=False, nullable=False)
    has_calendar_app_created = db.Column(db.Boolean, default=False, nullable=False)
    has_calendar_calendarlist_readonly = db.Column(db.Boolean, default=False, nullable=False)
    has_calendar_events_freebusy = db.Column(db.Boolean, default=False, nullable=False)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
