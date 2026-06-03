# pyright: reportUndefinedVariable=false
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class ChatHistory(db.Model):
    __tablename__ = "chat_history"
    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.String(36))
    report_id: Mapped[str | None] = mapped_column(
        db.String(255)
    )  # Nullable for agent conversations
    conversation_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("agent_conversations.id")
    )  # For agent-client conversations
    sender_id: Mapped[str | None] = mapped_column(
        db.String(36)
    )  # For agent conversations: agent_id or client_id
    role: Mapped[str] = mapped_column(db.String(10))  # 'user', 'assistant', or 'agent'
    message: Mapped[str] = mapped_column(db.Text)
    shared_home_id: Mapped[str | None] = mapped_column(
        db.String(255)
    )  # ID of shared home/property (zpid, address, or home_id)
    shared_document_id: Mapped[str | None] = mapped_column(db.String(255))  # ID of shared document
    timestamp: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    # Calendar event request status: 'pending' | 'accepted' | 'cancelled' (only for messages with __EVENT_REQUEST__ content)
    event_request_status: Mapped[str | None] = mapped_column(db.String(20))

    # Read receipt fields
    read_by: Mapped[str | None] = mapped_column(
        db.Text
    )  # JSON array of user IDs who have read this message
    read_at: Mapped[dict[str, Any] | None] = mapped_column(
        db.JSON
    )  # JSON object mapping user_id to read timestamp
    was_read: Mapped[bool] = mapped_column(
        default=False, server_default=db.text("false")
    )  # Simple boolean flag if message was read

    conversation: Mapped["AgentConnections | None"] = relationship(
        "AgentConnections",
        back_populates="messages",
    )

    def mark_as_read(self, user_id: str):
        """Mark this message as read by a user"""
        if not self.read_by:
            read_by_list = []
            read_at_dict = {}
        else:
            try:
                read_by_list = (
                    json.loads(self.read_by) if isinstance(self.read_by, str) else self.read_by
                )
                read_at_dict = (
                    self.read_at
                    if isinstance(self.read_at, dict)
                    else (json.loads(self.read_at) if isinstance(self.read_at, str) else {})
                )
            except Exception:
                read_by_list = []
                read_at_dict = {}

        if user_id not in read_by_list:
            read_by_list.append(user_id)
            # Use timezone-aware UTC timestamp
            read_at_dict[user_id] = datetime.now(timezone.utc).isoformat()
            self.read_by = json.dumps(read_by_list)
            self.read_at = read_at_dict

        # Set was_read to True when marked as read
        self.was_read = True

    def is_read_by(self, user_id: str) -> bool:
        """Check if message is read by a specific user"""
        if not self.read_by:
            return False
        try:
            read_by_list = (
                json.loads(self.read_by) if isinstance(self.read_by, str) else self.read_by
            )
            return user_id in read_by_list
        except Exception:
            return False
