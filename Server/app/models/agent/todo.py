import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class Todo(db.Model):
    """Represents a todo item for agents"""

    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    client_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("users.id")
    )  # Optional: associated client

    # Todo details
    title: Mapped[str] = mapped_column(db.String(500))
    description: Mapped[str | None] = mapped_column(db.Text)

    # Priority and type (nullable = unset / optional)
    priority: Mapped[str | None] = mapped_column(db.String(20))  # low, medium, high, urgent
    type: Mapped[str] = mapped_column(
        db.String(50), default="manual"
    )  # deadline, follow_up, inspection, offer_expiration, closing, manual

    # Dates (nullable = no deadline)
    due_date: Mapped[datetime | None] = mapped_column(db.DateTime)
    completed: Mapped[bool] = mapped_column(default=False)
    completed_at: Mapped[datetime | None] = mapped_column(db.DateTime)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    agent = db.relationship("User", foreign_keys=[agent_id], backref=db.backref("todos", lazy=True))
    client = db.relationship(
        "User", foreign_keys=[client_id], backref=db.backref("client_todos", lazy=True)
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<Todo {self.title}>"
