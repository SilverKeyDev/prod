from app import db
from datetime import datetime
import uuid

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    report_id = db.Column(db.String(255), nullable=True)  # Nullable for agent conversations
    conversation_id = db.Column(db.String(36), db.ForeignKey('agent_conversations.id'), nullable=True)  # For agent-client conversations
    sender_id = db.Column(db.String(36), nullable=True)  # For agent conversations: agent_id or client_id
    role = db.Column(db.String(10), nullable=False)  # 'user', 'assistant', or 'agent'
    message = db.Column(db.Text, nullable=False)
    shared_home_id = db.Column(db.String(255), nullable=True)  # ID of shared home/property (zpid, address, or home_id)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to agent conversation
    conversation = db.relationship('AgentConversation', backref=db.backref('messages', lazy=True))