from datetime import datetime
from app import db

class Subscription(db.Model):
    """Model for user subscriptions"""
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)  # Changed to String to match User.id
    plan_id = db.Column(db.String(50), nullable=False)  # e.g., '5-reports', 'unlimited-monthly'
    status = db.Column(db.String(20), nullable=False)  # active, trialing, past_due, canceled, unpaid
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    canceled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Usage tracking
    reports_used = db.Column(db.Integer, default=0)
    reports_limit = db.Column(db.Integer, nullable=False)  # -1 for unlimited
    
    # Relationships - using string reference to avoid circular imports
    user = db.relationship('User', back_populates='subscription', lazy='select')
    
    def __repr__(self):
        return f'<Subscription {self.plan_id} - {self.status}>'
    
    def to_dict(self):
        """Convert subscription to dictionary"""
        return {
            'id': self.id,
            'plan_id': self.plan_id,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancel_at_period_end': self.cancel_at_period_end,
            'canceled_at': self.canceled_at.isoformat() if self.canceled_at else None,
            'reports_used': self.reports_used,
            'reports_limit': self.reports_limit,
            'is_trialing': self.status == 'trialing',
            'next_billing_date': self.current_period_end.isoformat() if self.current_period_end else None
        }
