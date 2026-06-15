# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class AgentConnectionRequest(db.Model):
    """Represents a connection request between an agent and a client"""

    __tablename__ = "agent_connection_requests"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    client_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    requested_by_agent: Mapped[bool] = mapped_column(
        default=False
    )  # True if agent requested, False if client requested
    status: Mapped[str] = mapped_column(
        db.String(20), default="pending"
    )  # 'pending', 'accepted', 'rejected'
    message: Mapped[str | None] = mapped_column(db.Text)  # Optional message with the request
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
    responded_at: Mapped[datetime | None] = mapped_column(db.DateTime)

    agent: Mapped["User"] = relationship(
        "User",
        foreign_keys=[agent_id],
        back_populates="sent_agent_requests",
    )
    client: Mapped["User"] = relationship(
        "User",
        foreign_keys=[client_id],
        back_populates="received_agent_requests",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<AgentConnectionRequest {self.id} - Agent: {self.agent_id}, Client: {self.client_id}, Status: {self.status}>"
