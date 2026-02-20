import uuid
from datetime import datetime

from app import db


class AgentConnectionRequest(db.Model):
    """Represents a connection request between an agent and a client"""

    __tablename__ = "agent_connection_requests"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    requested_by_agent = db.Column(
        db.Boolean, nullable=False, default=False
    )  # True if agent requested, False if client requested
    status = db.Column(
        db.String(20), nullable=False, default="pending"
    )  # 'pending', 'accepted', 'rejected'
    message = db.Column(db.Text, nullable=True)  # Optional message with the request
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)

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
