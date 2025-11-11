from datetime import datetime
import uuid
from app import db

class Milestone(db.Model):
    """Represents a home buying milestone (tour, inspection, appraisal, closing)"""
    __tablename__ = 'milestones'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Milestone details
    type = db.Column(db.String(50), nullable=False)  # 'tour', 'inspection', 'appraisal', 'closing', etc.
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    property_address = db.Column(db.String(500))
    
    # Date/time
    scheduled_date = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=30)
    
    # Google Calendar integration
    google_event_id = db.Column(db.String(255))  # ID of the Google Calendar event
    google_calendar_id = db.Column(db.String(255), default="primary")
    google_event_link = db.Column(db.String(500))  # htmlLink to view in Google Calendar
    
    # Status
    status = db.Column(db.String(50), default="scheduled")  # 'scheduled', 'completed', 'cancelled', 'rescheduled'
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('milestones', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'description': self.description,
            'property_address': self.property_address,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'duration_minutes': self.duration_minutes,
            'google_event_id': self.google_event_id,
            'google_calendar_id': self.google_calendar_id,
            'google_event_link': self.google_event_link,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Milestone {self.type} - {self.title}>'

