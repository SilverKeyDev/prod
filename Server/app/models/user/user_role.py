"""User roles for multi-role support (agent, buyer, seller, investor, etc.). Replaces long-term reliance on is_agent and similar flags."""

import uuid
from datetime import datetime

from app import db


class UserRole(db.Model):
    __tablename__ = "user_roles"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # agent, buyer, seller, investor, ...
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "role", name="uq_user_roles_user_id_role"),)

    user = db.relationship("User", backref=db.backref("user_roles", lazy="dynamic"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
