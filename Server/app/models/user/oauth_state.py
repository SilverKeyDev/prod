# pyright: reportUndefinedVariable=false
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Mapped, mapped_column

from app import db


class OAuthState(db.Model):
    """Stores OAuth state for CSRF protection - works even when cookies/sessions fail"""

    __tablename__ = "oauth_states"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    state: Mapped[str] = mapped_column(db.String(255), unique=True, index=True)
    oauth_type: Mapped[str] = mapped_column(db.String(50))  # 'auth' or 'calendar'
    user_id: Mapped[str | None] = mapped_column(
        db.String(36)
    )  # Optional - None for auth flow before user exists
    used: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime] = mapped_column(db.DateTime)  # States expire after 10 minutes

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
        # Set expiration to 10 minutes from creation if not provided
        if not self.expires_at:
            self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    def is_expired(self) -> bool:
        """Check if state has expired"""
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > expires_at

    @classmethod
    def cleanup_expired(cls, older_than_hours: int = 1):
        """Delete expired or used states older than specified hours

        Args:
            older_than_hours: Delete states that expired or were used more than this many hours ago

        Returns:
            Number of records deleted
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=older_than_hours)
        result = db.session.execute(
            delete(cls).where((cls.expires_at < cutoff) | (cls.used.is_(True)))
        )
        deleted = result.rowcount
        db.session.commit()
        return deleted

    def __repr__(self):
        return (
            f"<OAuthState state={self.state[:20]}... oauth_type={self.oauth_type} used={self.used}>"
        )
