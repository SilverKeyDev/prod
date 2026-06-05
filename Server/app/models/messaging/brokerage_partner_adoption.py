"""Brokerage org adoption of an integrator partner product."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class BrokeragePartnerAdoption(db.Model):
    __tablename__ = "brokerage_partner_adoptions"
    __table_args__ = (
        db.UniqueConstraint(
            "brokerage_org_id",
            "partner_id",
            name="uq_brokerage_partner_adoptions_org_partner",
        ),
    )

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    brokerage_org_id: Mapped[str] = mapped_column(
        db.String(36),
        db.ForeignKey("brokerage_orgs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    partner_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True
    )
    adopted_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )

    brokerage_org: Mapped["BrokerageOrg"] = relationship("BrokerageOrg")
    partner: Mapped["Partner"] = relationship("Partner")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
