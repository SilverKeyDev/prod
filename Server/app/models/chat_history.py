from app import db
from datetime import datetime
import uuid

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    report_id = db.Column(db.String(100), nullable=False)  # Increased to accommodate longer report IDs
    role = db.Column(db.String(10), nullable=False)  # 'user' or 'assistant'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)