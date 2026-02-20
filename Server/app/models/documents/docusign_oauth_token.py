import uuid
from datetime import datetime, timezone

from app import db


class DocusignOAuthToken(db.Model):
    """DocuSign OAuth tokens per agent"""

    __tablename__ = "docusign_oauth_tokens"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, unique=True)

    # OAuth tokens
    access_token = db.Column(db.Text, nullable=False)  # Encrypted
    refresh_token = db.Column(db.Text, nullable=False)  # Encrypted
    token_expires_at = db.Column(db.DateTime, nullable=False)

    # DocuSign account info
    account_id = db.Column(db.String(100), nullable=False)
    base_uri = db.Column(db.String(255), nullable=False)  # DocuSign API base URL

    # Scopes
    scopes = db.Column(db.Text, nullable=False)  # JSON array

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("docusign_token", uselist=False))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self, include_tokens=False):
        result = {
            "id": self.id,
            "user_id": self.user_id,
            "account_id": self.account_id,
            "base_uri": self.base_uri,
            "scopes": self.scopes,
            "token_expires_at": self.token_expires_at.isoformat()
            if self.token_expires_at
            else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        # Never include tokens in standard serialization
        if include_tokens:
            result["access_token"] = self.access_token
            result["refresh_token"] = self.refresh_token

        return result

    def __repr__(self):
        return f"<DocusignOAuthToken {self.user_id}>"
