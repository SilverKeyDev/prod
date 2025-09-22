"""
Plaid Item Model
Stores Plaid access tokens and item information securely
"""

from datetime import datetime
from .. import db


class PlaidItem(db.Model):
    __tablename__ = 'plaid_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    item_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    access_token = db.Column(db.Text, nullable=False)  # Encrypted in production
    institution_id = db.Column(db.String(255), nullable=True)
    institution_name = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), default='active')  # active, error, disconnected
    linked_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('plaid_items', lazy=True))
    
    def to_dict(self):
        """Convert to dictionary for API responses (excludes sensitive data)"""
        return {
            'id': self.id,
            'item_id': self.item_id,
            'institution_id': self.institution_id,
            'institution_name': self.institution_name,
            'status': self.status,
            'linked_at': self.linked_at.isoformat() if self.linked_at else None,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<PlaidItem {self.item_id} for user {self.user_id}>'


class PlaidAssetReport(db.Model):
    __tablename__ = 'plaid_asset_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    plaid_item_id = db.Column(db.Integer, db.ForeignKey('plaid_items.id'), nullable=False)
    asset_report_token = db.Column(db.String(255), nullable=False, unique=True, index=True)
    asset_report_id = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), default='pending')  # pending, ready, error
    days_requested = db.Column(db.Integer, default=60)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('plaid_asset_reports', lazy=True))
    plaid_item = db.relationship('PlaidItem', backref=db.backref('asset_reports', lazy=True))
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'asset_report_token': self.asset_report_token,
            'asset_report_id': self.asset_report_id,
            'status': self.status,
            'days_requested': self.days_requested,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<PlaidAssetReport {self.asset_report_token} for user {self.user_id}>'
