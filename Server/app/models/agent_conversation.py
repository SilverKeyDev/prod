from datetime import datetime
import uuid
from app import db

class AgentConversation(db.Model):
    """Represents a conversation between an agent and a client"""
    
    __tablename__ = 'agent_conversations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    agent = db.relationship('User', foreign_keys=[agent_id], backref=db.backref('agent_conversations', lazy=True))
    client = db.relationship('User', foreign_keys=[client_id], backref=db.backref('client_conversations', lazy=True))
    
    def __init__(self, **kwargs):
        super(AgentConversation, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'client_id': self.client_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
        }
    
    def __repr__(self):
        return f'<AgentConversation {self.id} - Agent: {self.agent_id}, Client: {self.client_id}>'
