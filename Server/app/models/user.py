from datetime import datetime
import uuid
from app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cognito_id = db.Column(db.String(36), unique=True, nullable=True)  # Made nullable for Google OAuth users
    google_id = db.Column(db.String(255), unique=True, nullable=True)  # Google OAuth ID
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True)  # Made nullable for Google OAuth users who may not have name
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    has_preferences = db.Column(db.Boolean, default=False)
    
    subscription = db.relationship('Subscription', back_populates='user', uselist=False, lazy='select')
    user_preferences = db.relationship('UserPreferences', back_populates='user', uselist=False, lazy='select')
    is_agent = db.Column(db.Boolean, default=False)
    client_ids = db.Column(db.Text)  # array of ids of clients
    agent_id = db.Column(db.Text)  # array of ids of agents
    inspections_checklist = db.Column(db.Text)  # array of ids of inspections
    closing_checklist = db.Column(db.Text)  # array of ids of closings
    timeline_checklist = db.Column(db.Text)  # array of ids of timelines
    financing_checklist = db.Column(db.Text)  # array of ids of financings
    escrow_checklist = db.Column(db.Text)  # array of ids of escrows
    insurance_checklist = db.Column(db.Text)  # array of ids of insurance tasks

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())
            print(f"[DEBUG] New User ID generated in __init__: {self.id}")
        else:
            print(f"[DEBUG] Existing User ID: {self.id}")
    
    def to_dict(self):
        # Determine auth method
        if self.google_id and not self.cognito_id:
            auth_method = 'google'
        elif self.cognito_id and not self.google_id:
            auth_method = 'cognito'
        elif self.google_id and self.cognito_id:
            auth_method = 'both'
        else:
            auth_method = 'unknown'
        
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name or 'Unknown User',  # Fallback for null names
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active,
            'has_subscription': self.subscription is not None,
            'subscription': self.subscription.to_dict() if self.subscription else None,
            'has_preferences': self.has_preferences,
            'is_agent': self.is_agent,
            'client_ids': self.client_ids,
            'agent_id': self.agent_id,
            'inspections_checklist': self.inspections_checklist,
            'closing_checklist': self.closing_checklist,
            'timeline_checklist': self.timeline_checklist,
            'insurance_checklist': self.insurance_checklist,
            'auth_method': auth_method,  # NEW: Indicate authentication method
        }
