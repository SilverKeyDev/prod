# pyright: reportUndefinedVariable=false
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class AgentConnections(db.Model):
    """Represents a conversation between an agent and a client"""

    __tablename__ = "agent_conversations"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    client_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
    last_message_at: Mapped[datetime | None] = mapped_column(db.DateTime)

    # Read receipt tracking - JSON object mapping user_id to last_read_at timestamp
    last_read_at: Mapped[str | None] = mapped_column(
        db.Text
    )  # JSON: {"agent_id": "2024-01-01T00:00:00", "client_id": "2024-01-01T00:00:00"}

    agent: Mapped["User"] = relationship(
        "User",
        foreign_keys=[agent_id],
        back_populates="agent_conversations",
    )
    client: Mapped["User"] = relationship(
        "User",
        foreign_keys=[client_id],
        back_populates="client_conversations",
    )
    messages: Mapped[list["ChatHistory"]] = relationship(
        "ChatHistory",
        back_populates="conversation",
        lazy=True,
    )

    def update_last_read(self, user_id: str):
        """Update the last read timestamp for a user"""
        if not self.last_read_at:
            last_read_dict = {}
        else:
            try:
                last_read_dict = (
                    json.loads(self.last_read_at)
                    if isinstance(self.last_read_at, str)
                    else self.last_read_at
                )
            except Exception:
                last_read_dict = {}

        # Use timezone-aware UTC timestamp
        last_read_dict[user_id] = datetime.now(timezone.utc).isoformat()
        self.last_read_at = json.dumps(last_read_dict)

    def get_last_read(self, user_id: str) -> datetime | None:
        """Get the last read timestamp for a user"""
        if not self.last_read_at:
            return None
        try:
            last_read_dict = (
                json.loads(self.last_read_at)
                if isinstance(self.last_read_at, str)
                else self.last_read_at
            )
            if not isinstance(last_read_dict, dict):
                return None
            read_str = last_read_dict.get(user_id)
            if read_str:
                # Handle ISO format with or without timezone
                if read_str.endswith("Z"):
                    read_str = read_str.replace("Z", "+00:00")
                return datetime.fromisoformat(read_str)
            return None
        except Exception:
            return None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<AgentConnections {self.id} - Agent: {self.agent_id}, Client: {self.client_id}>"
