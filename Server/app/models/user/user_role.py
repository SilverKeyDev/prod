"""User roles for multi-role support (agent, buyer, seller, investor, etc.). Replaces long-term reliance on is_agent and similar flags."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserRole(db.Model):
    __tablename__ = "user_roles"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(db.String(50))  # agent, buyer, seller, investor, ...
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "role", name="uq_user_roles_user_id_role"),)

    user = db.relationship(
        "User",
        backref=db.backref(
            "user_roles",
            lazy="dynamic",
            cascade="all, delete-orphan",
            passive_deletes=True,
        ),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
