"""Per-agent, per–hub-client checklist step dispatch automation preferences."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class ChecklistItemDispatchSetting(db.Model):
    """
    When enabled, newly checking off a step for the hub client can trigger messaging
    and/or DocuSign for one or more recipients per agent configuration.
    """

    __tablename__ = "checklist_item_dispatch_settings"
    __table_args__ = (
        db.UniqueConstraint(
            "agent_user_id",
            "client_user_id",
            "category",
            "item_id",
            name="uq_checklist_dispatch_agent_client_category_item",
        ),
    )

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), index=True)
    client_user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), index=True)
    transaction_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("transactions.id", ondelete="CASCADE"),
        index=True,
    )
    category: Mapped[str] = mapped_column(db.String(50))
    item_id: Mapped[int] = mapped_column(db.Integer)

    enabled: Mapped[bool] = mapped_column(db.Boolean, default=False)
    channel: Mapped[str] = mapped_column(db.String(20), default="messaging")
    recipient_scope: Mapped[str] = mapped_column(db.String(30), default="context_client")
    selected_client_ids: Mapped[list[Any] | None] = mapped_column(db.JSON, nullable=True)
    note_mode: Mapped[str] = mapped_column(db.String(20), default="none")
    note_broadcast: Mapped[str | None] = mapped_column(db.Text, nullable=True)
    notes_per_client: Mapped[dict[str, Any] | None] = mapped_column(db.JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_api_dict(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "channel": self.channel,
            "recipientScope": self.recipient_scope,
            "selectedClientIds": self.selected_client_ids,
            "noteMode": self.note_mode,
            "noteBroadcast": self.note_broadcast,
            "notesPerClient": self.notes_per_client,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
