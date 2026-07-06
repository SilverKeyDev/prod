"""
Buyer-broker agreement review gate models — SIL-183.

buyer_broker_reviews: one row per transaction tracking current review status.
buyer_broker_review_events: append-only audit log of every status transition.

Status machine:
  pending_review → approved (agent approves after call)
  pending_review → meeting_requested (agent requests meeting)
  meeting_requested → approved (agent approves after meeting)
  approved → agreement_sent (system sends BBA via DocuSign)
  approved → pending_review (material preference change invalidates — Phase 2)

RESPA compliance: every status change is logged in buyer_broker_review_events
with agent_id, timestamp, and optional note. LogPath: TRANSACTIONS.BBA_REVIEW.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db

BBA_REVIEW_STATUSES = (
    "pending_review",
    "meeting_requested",
    "approved",
    "agreement_sent",
)


class BuyerBrokerReview(db.Model):
    """
    One row per transaction — tracks current BBA review status.
    Created automatically when a transaction reaches checklist item 6.
    """

    __tablename__ = "buyer_broker_reviews"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    transaction_id: Mapped[str] = mapped_column(
        db.ForeignKey("transactions.id"),
        nullable=False,
        unique=True,  # 1:1 with transaction
        index=True,
    )
    status: Mapped[str] = mapped_column(
        db.String(32), nullable=False, default="pending_review"
    )
    # Set when agent approves
    approved_by_agent_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Set when meeting is requested
    meeting_requested_by_agent_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("users.id"), nullable=True
    )
    meeting_requested_at: Mapped[datetime | None] = mapped_column(nullable=True)
    meeting_note: Mapped[str | None] = mapped_column(db.String(1000), nullable=True)

    # Phase 2: hash of material preferences at approval time.
    # If buyer changes budget/location/criteria after approval, fingerprint
    # mismatch voids approval back to pending_review. TODO SIL-183 Phase 2.
    approved_preferences_fingerprint: Mapped[str | None] = mapped_column(
        db.String(64), nullable=True
    )

    # Set when agreement is sent
    agreement_sent_at: Mapped[datetime | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    events: Mapped[list["BuyerBrokerReviewEvent"]] = relationship(
        "BuyerBrokerReviewEvent",
        back_populates="review",
        order_by="BuyerBrokerReviewEvent.created_at",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())


class BuyerBrokerReviewEvent(db.Model):
    """
    Append-only audit log — one row per status transition or action.
    Never deleted. Required for RESPA compliance.
    """

    __tablename__ = "buyer_broker_review_events"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    review_id: Mapped[str] = mapped_column(
        db.ForeignKey("buyer_broker_reviews.id"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(
        db.String(64), nullable=False
    )  # approved | meeting_requested | agreement_sent | invalidated
    actor_agent_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("users.id"), nullable=True
    )
    note: Mapped[str | None] = mapped_column(db.String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )

    review: Mapped["BuyerBrokerReview"] = relationship(
        "BuyerBrokerReview", back_populates="events"
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())