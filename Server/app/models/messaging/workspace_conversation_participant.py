"""Participants in workspace conversations."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class WorkspaceConversationParticipant(db.Model):
    __tablename__ = "workspace_conversation_participants"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    conversation_id: Mapped[str] = mapped_column(
        db.String(36),
        db.ForeignKey("workspace_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_role: Mapped[str] = mapped_column(db.String(32), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    left_at: Mapped[datetime | None] = mapped_column(db.DateTime, nullable=True)
    added_by_user_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True
    )

    conversation: Mapped["WorkspaceConversation"] = relationship(
        "WorkspaceConversation",
        back_populates="participants",
    )
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_workspace_conv_participant"),
        Index("idx_workspace_participant_user_left", "user_id", "left_at"),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    @property
    def is_active(self) -> bool:
        return self.left_at is None
