from ..extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    cognito_id = db.Column(db.String(36), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    agency_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        # Generate a UUID for the user if not provided
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'agency_name': self.agency_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }
