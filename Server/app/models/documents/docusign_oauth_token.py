# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class DocusignOAuthToken(db.Model):
    """DocuSign OAuth tokens per agent"""

    __tablename__ = "docusign_oauth_tokens"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36), db.ForeignKey("users.id"), unique=True)

    # OAuth tokens
    access_token: Mapped[str] = mapped_column(db.Text)  # Encrypted
    refresh_token: Mapped[str] = mapped_column(db.Text)  # Encrypted
    token_expires_at: Mapped[datetime] = mapped_column(db.DateTime)

    # DocuSign account info
    account_id: Mapped[str] = mapped_column(db.String(100))
    base_uri: Mapped[str] = mapped_column(db.String(255))  # DocuSign API base URL

    # Scopes
    scopes: Mapped[str] = mapped_column(db.Text)  # JSON array

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="docusign_token")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<DocusignOAuthToken {self.user_id}>"
