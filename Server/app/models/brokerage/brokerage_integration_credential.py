"""Encrypted per-brokerage third-party integration credentials."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db

SKYSLOPE_PROVIDER = "skyslope"

CREDENTIAL_STATUS_ACTIVE = "active"
CREDENTIAL_STATUS_INVALID = "invalid"
CREDENTIAL_STATUS_PENDING = "pending"


class BrokerageIntegrationCredential(db.Model):
    """Per-brokerage integration secrets (encrypted at rest)."""

    __tablename__ = "brokerage_integration_credentials"
    __table_args__ = (
        UniqueConstraint(
            "brokerage_id",
            "provider",
            name="uq_brokerage_integration_credentials_brokerage_provider",
        ),
    )

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    brokerage_id: Mapped[str] = mapped_column(
        db.String(36),
        db.ForeignKey("brokerage_orgs.id"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(db.String(64), nullable=False)
    encrypted_payload: Mapped[str] = mapped_column(db.Text, nullable=False)
    key_last4: Mapped[str | None] = mapped_column(db.String(4), nullable=True)
    skyslope_org_id: Mapped[str | None] = mapped_column(db.String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        db.String(32), nullable=False, default=CREDENTIAL_STATUS_ACTIVE
    )
    last_verified_at: Mapped[datetime | None] = mapped_column(db.DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    brokerage_org: Mapped["BrokerageOrg"] = relationship(
        "BrokerageOrg", back_populates="integration_credentials"
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self) -> str:
        return (
            f"<BrokerageIntegrationCredential brokerage_id={self.brokerage_id} "
            f"provider={self.provider}>"
        )
