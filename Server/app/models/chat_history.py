import uuid
from datetime import datetime

from app import db


class ChatHistory(db.Model):
    __tablename__ = "chat_history"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    report_id = db.Column(
        db.String(255), nullable=False
    )  # Increased to accommodate longer comparison report IDs
    role = db.Column(db.String(10), nullable=False)  # 'user' or 'assistant'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
