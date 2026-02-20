import json
import uuid
from datetime import datetime, timezone

from app import db


class AgentConnections(db.Model):
    """Represents a conversation between an agent and a client"""

    __tablename__ = "agent_conversations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, nullable=True)

    # Read receipt tracking - JSON object mapping user_id to last_read_at timestamp
    last_read_at = db.Column(
        db.Text, nullable=True
    )  # JSON: {"agent_id": "2024-01-01T00:00:00", "client_id": "2024-01-01T00:00:00"}

    # Relationships
    agent = db.relationship(
        "User", foreign_keys=[agent_id], backref=db.backref("agent_conversations", lazy=True)
    )
    client = db.relationship(
        "User", foreign_keys=[client_id], backref=db.backref("client_conversations", lazy=True)
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

    def to_dict(self, user_id: str | None = None):
        # Helper function to format datetime as timezone-aware UTC ISO string
        def format_timestamp(dt):
            if not dt:
                return None
            if dt.tzinfo is None:
                # Naive datetime - assume UTC and make it timezone-aware
                dt_aware = dt.replace(tzinfo=timezone.utc)
            else:
                dt_aware = dt.astimezone(timezone.utc)
            return dt_aware.isoformat()

        result = {
            "id": self.id,
            "agent_id": self.agent_id,
            "client_id": self.client_id,
            "created_at": format_timestamp(self.created_at),
            "updated_at": format_timestamp(self.updated_at),
            "last_message_at": format_timestamp(self.last_message_at),
        }

        # Include last_read_at for the requesting user if provided
        if user_id:
            last_read = self.get_last_read(user_id)
            result["last_read_at"] = format_timestamp(last_read)

        return result

    def __repr__(self):
        return f"<AgentConnections {self.id} - Agent: {self.agent_id}, Client: {self.client_id}>"
