"""Email campaign ORM models (SIL-306)."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EmailCampaign(db.Model):
    __tablename__ = "email_campaigns"

    id: Mapped[str] = mapped_column(db.String(36), primary_key=True)
    brokerage_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("brokerage_orgs.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    goal_metric: Mapped[str] = mapped_column(db.String(64), nullable=False)
    status: Mapped[str] = mapped_column(db.String(32), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(nullable=True)
    baseline_attach_rate_percent: Mapped[float | None] = mapped_column(db.Float, nullable=True)
    post_attach_rate_percent: Mapped[float | None] = mapped_column(db.Float, nullable=True)

    variants: Mapped[list["EmailCampaignVariant"]] = relationship(
        "EmailCampaignVariant",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    recipients: Mapped[list["EmailCampaignRecipient"]] = relationship(
        "EmailCampaignRecipient",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    __table_args__ = (Index("ix_email_campaigns_brokerage_status", "brokerage_id", "status"),)


class EmailCampaignVariant(db.Model):
    __tablename__ = "email_campaign_variants"

    id: Mapped[str] = mapped_column(db.String(36), primary_key=True)
    campaign_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("email_campaigns.id"), nullable=False, index=True
    )
    variant_key: Mapped[str] = mapped_column(db.String(1), nullable=False)
    subject: Mapped[str] = mapped_column(db.String(500), nullable=False)
    body_template: Mapped[str] = mapped_column(db.Text, nullable=False)

    campaign: Mapped["EmailCampaign"] = relationship("EmailCampaign", back_populates="variants")

    __table_args__ = (
        UniqueConstraint("campaign_id", "variant_key", name="uq_campaign_variant_key"),
    )


class EmailCampaignRecipient(db.Model):
    __tablename__ = "email_campaign_recipients"

    id: Mapped[str] = mapped_column(db.String(36), primary_key=True)
    campaign_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("email_campaigns.id"), nullable=False, index=True
    )
    agent_id: Mapped[str] = mapped_column(db.String(36), nullable=False, index=True)
    agent_name: Mapped[str | None] = mapped_column(db.String(255), nullable=True)
    variant_key: Mapped[str] = mapped_column(db.String(1), nullable=False)
    send_status: Mapped[str] = mapped_column(db.String(32), nullable=False, default="pending")
    sent_at: Mapped[datetime | None] = mapped_column(nullable=True)

    campaign: Mapped["EmailCampaign"] = relationship("EmailCampaign", back_populates="recipients")
    events: Mapped[list["EmailCampaignEvent"]] = relationship(
        "EmailCampaignEvent",
        back_populates="recipient",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("campaign_id", "agent_id", name="uq_campaign_recipient_agent"),
    )


class EmailCampaignEvent(db.Model):
    __tablename__ = "email_campaign_events"

    id: Mapped[str] = mapped_column(db.String(36), primary_key=True)
    recipient_id: Mapped[str] = mapped_column(
        db.String(36),
        db.ForeignKey("email_campaign_recipients.id"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(db.String(32), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(default=_utcnow, nullable=False)
    # Optional attribution fields for demo seed / results
    service: Mapped[str | None] = mapped_column(db.String(64), nullable=True)
    attributed: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)

    recipient: Mapped["EmailCampaignRecipient"] = relationship(
        "EmailCampaignRecipient", back_populates="events"
    )

    __table_args__ = (Index("ix_email_campaign_events_type_occurred", "event_type", "occurred_at"),)
