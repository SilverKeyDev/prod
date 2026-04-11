import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

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

    # Relationships
    agent = db.relationship(
        "User", foreign_keys=[agent_id], backref=db.backref("sent_agent_requests", lazy=True)
    )
    client = db.relationship(
        "User", foreign_keys=[client_id], backref=db.backref("received_agent_requests", lazy=True)
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "client_id": self.client_id,
            "requested_by_agent": self.requested_by_agent,
            "status": self.status,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "responded_at": self.responded_at.isoformat() if self.responded_at else None,
        }

    def __repr__(self):
        return f"<AgentConnectionRequest {self.id} - Agent: {self.agent_id}, Client: {self.client_id}, Status: {self.status}>"
