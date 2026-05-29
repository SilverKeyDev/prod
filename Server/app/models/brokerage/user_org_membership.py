"""User membership in a brokerage org (agent, admin, or member buyer)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db

MEMBERSHIP_ROLES = frozenset({"agent", "admin", "member"})


class UserOrgMembership(db.Model):
    __tablename__ = "user_org_memberships"
    __table_args__ = (
        db.UniqueConstraint("user_id", "brokerage_org_id", name="uq_user_org_memberships_user_org"),
    )

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id", ondelete="CASCADE"), index=True)
    brokerage_org_id: Mapped[str] = mapped_column(
        db.ForeignKey("brokerage_orgs.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(db.String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = db.relationship("User", backref=db.backref("org_memberships", lazy="dynamic"))
    brokerage_org = db.relationship(
        "BrokerageOrg", backref=db.backref("memberships", lazy="dynamic")
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
