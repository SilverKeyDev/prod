from datetime import datetime, timezone
import uuid
from app import db

class DocusignTemplate(db.Model):
    """DocuSign template cache"""
    __tablename__ = 'docusign_templates'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # DocuSign fields
    docusign_template_id = db.Column(db.String(100), nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Metadata
    template_variables = db.Column(db.Text, nullable=True)  # JSON schema of variables
    category = db.Column(db.String(50), nullable=True)  # offer, inspection, financing, etc.
    
    # Sync tracking
    synced_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = db.Column(db.Boolean, default=True)
    
    def __init__(self, **kwargs):
        super(DocusignTemplate, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
    
    def to_dict(self):
        return {
            'id': self.id,
            'docusign_template_id': self.docusign_template_id,
            'name': self.name,
            'description': self.description,
            'template_variables': self.template_variables,
            'category': self.category,
            'synced_at': self.synced_at.isoformat() if self.synced_at else None,
            'is_active': self.is_active,
        }
    
    def __repr__(self):
        return f'<DocusignTemplate {self.name}>'
