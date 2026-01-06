from datetime import datetime
import uuid
from app import db


class CalendarEvent(db.Model):
    """Represents a calendar event stored in the database"""
    __tablename__ = 'calendar_events'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    calendar_id = db.Column(db.String(255), nullable=True)  # Google Calendar ID (e.g., "primary" or calendar ID)
    
    # Event identification
    google_event_id = db.Column(db.String(255), unique=True, nullable=True)  # Google Calendar event ID
    summary = db.Column(db.String(500), nullable=False)  # Event title
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(500), nullable=True)
    
    # Event type/category
    event_type = db.Column(db.String(100), nullable=True)  # e.g., "property_viewing", "inspection", "closing", "meeting", etc.
    
    # Creator information
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)  # ID of user who created the event
    
    # Date and time
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    timezone = db.Column(db.String(100), default="UTC")
    
    # Duration (calculated field, stored for convenience)
    duration_minutes = db.Column(db.Integer, nullable=True)  # Duration in minutes
    
    # Attendees (stored as JSON)
    attendees = db.Column(db.JSON, nullable=True)  # List of attendee objects with email, displayName, etc.
    
    # Reminders
    reminders = db.Column(db.JSON, nullable=True)  # Reminder settings
    
    # Event status
    status = db.Column(db.String(50), default="confirmed")  # confirmed, tentative, cancelled
    
    # Sync information
    is_synced = db.Column(db.Boolean, default=False)
    last_synced_at = db.Column(db.DateTime, nullable=True)
    sync_source = db.Column(db.String(50), default="google")  # google, local, etc.
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('calendar_events', lazy=True))
    creator = db.relationship('User', foreign_keys=[creator_id], backref=db.backref('created_events', lazy=True))
    
    def __init__(self, **kwargs):
        super(CalendarEvent, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
        
        # Calculate duration if start and end are provided
        if self.start_datetime and self.end_datetime and not self.duration_minutes:
            delta = self.end_datetime - self.start_datetime
            self.duration_minutes = int(delta.total_seconds() / 60)
    
    def calculate_duration(self):
        """Calculate and update duration based on start and end datetime"""
        if self.start_datetime and self.end_datetime:
            delta = self.end_datetime - self.start_datetime
            self.duration_minutes = int(delta.total_seconds() / 60)
            return self.duration_minutes
        return None
    
    def to_dict(self):
        """Convert event to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'calendar_id': self.calendar_id,
            'google_event_id': self.google_event_id,
            'summary': self.summary,
            'description': self.description,
            'location': self.location,
            'event_type': self.event_type,
            'creator_id': self.creator_id,
            'start_datetime': self.start_datetime.isoformat() if self.start_datetime else None,
            'end_datetime': self.end_datetime.isoformat() if self.end_datetime else None,
            'timezone': self.timezone,
            'duration_minutes': self.duration_minutes,
            'attendees': self.attendees,
            'reminders': self.reminders,
            'status': self.status,
            'is_synced': self.is_synced,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None,
            'sync_source': self.sync_source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<CalendarEvent {self.summary} - {self.start_datetime}>'

