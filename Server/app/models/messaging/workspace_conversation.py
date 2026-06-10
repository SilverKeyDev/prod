"""Workspace-scoped conversations (brokerage, integrator, support, future group)."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class WorkspaceConversation(db.Model):
    __tablename__ = "workspace_conversations"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    kind: Mapped[str] = mapped_column(db.String(32), nullable=False, index=True)
    brokerage_org_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("brokerage_orgs.id"), nullable=True, index=True
    )
    partner_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("partners.id"), nullable=True, index=True
    )
    subject_user_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True, index=True
    )
    support_category: Mapped[str | None] = mapped_column(db.String(32), nullable=True)
    agent_user_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True, index=True
    )
    title: Mapped[str | None] = mapped_column(db.String(120), nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True
    )
    participant_count: Mapped[int] = mapped_column(db.Integer, nullable=False, default=0)
    is_archived: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    last_message_at: Mapped[datetime | None] = mapped_column(db.DateTime, nullable=True)
    last_read_at: Mapped[str | None] = mapped_column(db.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    participants: Mapped[list["WorkspaceConversationParticipant"]] = relationship(
        "WorkspaceConversationParticipant",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )
    messages: Mapped[list["ChatHistory"]] = relationship(
        "ChatHistory",
        back_populates="workspace_conversation",
        foreign_keys="ChatHistory.workspace_conversation_id",
    )

    __table_args__ = (
        UniqueConstraint(
            "kind",
            "subject_user_id",
            "support_category",
            name="uq_workspace_conv_platform_support",
        ),
        UniqueConstraint(
            "kind",
            "brokerage_org_id",
            "agent_user_id",
            name="uq_workspace_conv_brokerage_agent",
        ),
        UniqueConstraint(
            "kind",
            "partner_id",
            "brokerage_org_id",
            name="uq_workspace_conv_integrator_brokerage",
        ),
        Index("idx_workspace_conv_kind_updated", "kind", "updated_at"),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
