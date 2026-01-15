from datetime import datetime
# Import db from the main app package to ensure we're using the same instance
from app import db

class PDFDocument(db.Model):
    __tablename__ = 'pdf_documents'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer)  # Size in bytes
    status = db.Column(db.String(20), default='uploaded')  # uploaded, processing, processed, error
    
    # Report details
    primary_address = db.Column(db.Text, nullable=True)  # Primary property address
    report_type = db.Column(db.String(20), default='detailed')  # 'detailed' or 'comparison'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('documents', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_size': self.file_size,
            'status': self.status,
            'primary_address': self.primary_address,
            'report_type': self.report_type,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<PDFDocument {self.filename}>'
