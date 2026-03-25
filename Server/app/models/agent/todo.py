import uuid
from datetime import datetime

from app import db


class Todo(db.Model):
    """Represents a todo item for agents"""

    __tablename__ = "todos"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=True
    )  # Optional: associated client

    # Todo details
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Priority and type (nullable = unset / optional)
    priority = db.Column(db.String(20), nullable=True)  # low, medium, high, urgent
    type = db.Column(
        db.String(50), nullable=False, default="manual"
    )  # deadline, follow_up, inspection, offer_expiration, closing, manual

    # Dates (nullable = no deadline)
    due_date = db.Column(db.DateTime, nullable=True)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agent = db.relationship("User", foreign_keys=[agent_id], backref=db.backref("todos", lazy=True))
    client = db.relationship(
        "User", foreign_keys=[client_id], backref=db.backref("client_todos", lazy=True)
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        """Convert todo to dictionary"""
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "client_id": self.client_id,
            "title": self.title,
            "description": self.description,
            "priority": self.priority,
            "type": self.type,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "completed": self.completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Todo {self.title} - {self.priority or 'none'}>"
