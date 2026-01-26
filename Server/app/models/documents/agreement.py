from datetime import datetime, timezone
import uuid
from app import db

class Agreement(db.Model):
    """Agreement model - system of record for DocuSign agreements"""
    __tablename__ = 'agreements'
    
    # Core fields
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status = db.Column(db.String(20), nullable=False, default='draft')  # draft, sent, delivered, signed, completed, voided, declined
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Parties
    agent_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    buyer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Document versioning
    current_revision_id = db.Column(
        db.String(36),
        db.ForeignKey('agreement_revisions.id', ondelete='SET NULL'),
        nullable=True,
        index=True
    )
    
    # DocuSign integration (nullable until sent)
    docusign_envelope_id = db.Column(db.String(100), nullable=True, unique=True)
    docusign_status = db.Column(db.String(50), nullable=True)  # Raw DocuSign status
    
    # Metadata
    property_address = db.Column(db.Text, nullable=True)
    agreement_type = db.Column(db.String(50), nullable=False)  # offer, inspection_contingency, financing, etc.
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    sent_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    voided_at = db.Column(db.DateTime, nullable=True)
    
    # S3 paths for completed documents
    signed_document_path = db.Column(db.String(512), nullable=True)
    certificate_path = db.Column(db.String(512), nullable=True)
    
    # Relationships
    participants = db.relationship(
        'AgreementParticipant',
        back_populates='agreement',
        cascade='all, delete-orphan',
        lazy='select'
    )
    events = db.relationship(
        'AgreementEvent',
        back_populates='agreement',
        cascade='all, delete-orphan',
        order_by='AgreementEvent.created_at.desc()',
        lazy='select'
    )
    current_revision = db.relationship(
        'AgreementRevision',
        foreign_keys=[current_revision_id],
        uselist=False,
        post_update=True,
        lazy='joined',
        overlaps='revisions'
    )
    revisions = db.relationship(
        'AgreementRevision',
        back_populates='agreement',
        foreign_keys='AgreementRevision.agreement_id',
        cascade='all, delete-orphan',
        order_by='AgreementRevision.version_number.desc()',
        lazy='select',
        overlaps='current_revision'
    )
    
    def __init__(self, **kwargs):
        super(Agreement, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
    
    def to_dict(self, include_relationships=False):
        result = {
            'id': self.id,
            'status': self.status,
            'title': self.title,
            'description': self.description,
            'agent_id': self.agent_id,
            'buyer_id': self.buyer_id,
            'current_revision_id': self.current_revision_id,
            'docusign_envelope_id': self.docusign_envelope_id,
            'docusign_status': self.docusign_status,
            'property_address': self.property_address,
            'agreement_type': self.agreement_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'voided_at': self.voided_at.isoformat() if self.voided_at else None,
            'signed_document_path': self.signed_document_path,
            'certificate_path': self.certificate_path,
        }
        
        if include_relationships:
            result['participants'] = [p.to_dict() for p in self.participants] if hasattr(self, 'participants') else []
            result['events'] = [e.to_dict() for e in self.events[:10]] if hasattr(self, 'events') else []  # Last 10 events
            result['current_revision'] = self.current_revision.to_dict() if hasattr(self, 'current_revision') and self.current_revision else None
        
        return result
    
    def __repr__(self):
        return f'<Agreement {self.id} - {self.title}>'
