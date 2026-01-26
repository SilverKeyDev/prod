from app import db
from datetime import datetime, timezone
import uuid
import json

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
    shared_document_id = db.Column(db.String(255), nullable=True)  # ID of shared document
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Read receipt fields
    read_by = db.Column(db.Text, nullable=True)  # JSON array of user IDs who have read this message
    read_at = db.Column(db.JSON, nullable=True)  # JSON object mapping user_id to read timestamp
    was_read = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text('false'))  # Simple boolean flag if message was read
    
    # Relationship to agent conversation
    conversation = db.relationship('AgentConnections', backref=db.backref('messages', lazy=True))
    
    def mark_as_read(self, user_id: str):
        """Mark this message as read by a user"""
        if not self.read_by:
            read_by_list = []
            read_at_dict = {}
        else:
            try:
                read_by_list = json.loads(self.read_by) if isinstance(self.read_by, str) else self.read_by
                read_at_dict = self.read_at if isinstance(self.read_at, dict) else (json.loads(self.read_at) if isinstance(self.read_at, str) else {})
            except:
                read_by_list = []
                read_at_dict = {}
        
        if user_id not in read_by_list:
            read_by_list.append(user_id)
            # Use timezone-aware UTC timestamp
            read_at_dict[user_id] = datetime.now(timezone.utc).isoformat()
            self.read_by = json.dumps(read_by_list)
            self.read_at = read_at_dict
        
        # Set was_read to True when marked as read
        self.was_read = True
    
    def is_read_by(self, user_id: str) -> bool:
        """Check if message is read by a specific user"""
        if not self.read_by:
            return False
        try:
            read_by_list = json.loads(self.read_by) if isinstance(self.read_by, str) else self.read_by
            return user_id in read_by_list
        except:
            return False