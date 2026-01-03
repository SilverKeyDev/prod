from datetime import datetime
import uuid
from app import db

class Calendar(db.Model):
    """Represents a user's calendar configuration and metadata"""
    __tablename__ = 'calendars'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Calendar identification
    calendar_name = db.Column(db.String(255), nullable=False)  # e.g., "SilverKey", "Primary"
    google_calendar_id = db.Column(db.String(255))  # Google Calendar ID
    calendar_type = db.Column(db.String(50), default="google")  # 'google', 'local', etc.
    
    # Calendar metadata
    description = db.Column(db.Text)
    timezone = db.Column(db.String(100), default="UTC")
    color_id = db.Column(db.String(10))  # Google Calendar color ID
    
    # Sync status
    is_synced = db.Column(db.Boolean, default=False)
    last_sync_at = db.Column(db.DateTime, nullable=True)
    sync_enabled = db.Column(db.Boolean, default=True)
    
    # Calendar settings
    is_primary = db.Column(db.Boolean, default=False)
    is_visible = db.Column(db.Boolean, default=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('calendars', lazy=True))
    
    def __init__(self, **kwargs):
        super(Calendar, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'calendar_name': self.calendar_name,
            'google_calendar_id': self.google_calendar_id,
            'calendar_type': self.calendar_type,
            'description': self.description,
            'timezone': self.timezone,
            'color_id': self.color_id,
            'is_synced': self.is_synced,
            'last_sync_at': self.last_sync_at.isoformat() if self.last_sync_at else None,
            'sync_enabled': self.sync_enabled,
            'is_primary': self.is_primary,
            'is_visible': self.is_visible,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Calendar {self.calendar_name} - {self.user_id}>'

