"""Transaction checklist progress. One row per user/category or per completed item.
Category: escrow, financing, closing, insurance, timeline.
Stored in table user_tasks for backward compatibility."""

import uuid
from datetime import datetime

from app import db


class TransactionTask(db.Model):
    __tablename__ = "user_tasks"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="todo")
    due_date = db.Column(db.DateTime, nullable=True)
    order_index = db.Column(db.Integer, nullable=True)
    task_metadata = db.Column("metadata", db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("user_tasks", lazy="dynamic"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
