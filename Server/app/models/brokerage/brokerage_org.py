"""Brokerage organization — attribution boundary (not row-level isolation)."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import DynamicMapped, Mapped, mapped_column, relationship

from app import db


class BrokerageOrg(db.Model):
    __tablename__ = "brokerage_orgs"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    slug: Mapped[str] = mapped_column(db.String(128), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    memberships: DynamicMapped["UserOrgMembership"] = relationship(
        "UserOrgMembership",
        back_populates="brokerage_org",
        lazy="dynamic",
    )
    integration_credentials: Mapped[list["BrokerageIntegrationCredential"]] = relationship(
        "BrokerageIntegrationCredential",
        back_populates="brokerage_org",
        cascade="all, delete-orphan",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
