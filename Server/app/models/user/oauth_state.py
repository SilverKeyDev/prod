import uuid
from datetime import datetime, timedelta

from app import db


class OAuthState(db.Model):
    """Stores OAuth state for CSRF protection - works even when cookies/sessions fail"""

    __tablename__ = "oauth_states"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    state = db.Column(db.String(255), nullable=False, unique=True, index=True)
    oauth_type = db.Column(db.String(50), nullable=False)  # 'auth' or 'calendar'
    user_id = db.Column(
        db.String(36), nullable=True
    )  # Optional - None for auth flow before user exists
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)  # States expire after 10 minutes

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
        # Set expiration to 10 minutes from creation if not provided
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(minutes=10)

    def is_expired(self) -> bool:
        """Check if state has expired"""
        return datetime.utcnow() > self.expires_at

    @classmethod
    def cleanup_expired(cls, older_than_hours: int = 1):
        """Delete expired or used states older than specified hours

        Args:
            older_than_hours: Delete states that expired or were used more than this many hours ago

        Returns:
            Number of records deleted
        """
        cutoff = datetime.utcnow() - timedelta(hours=older_than_hours)
        deleted = cls.query.filter((cls.expires_at < cutoff) | (cls.used is True)).delete(
            synchronize_session=False
        )
        db.session.commit()
        return deleted

    def __repr__(self):
        return (
            f"<OAuthState state={self.state[:20]}... oauth_type={self.oauth_type} used={self.used}>"
        )
