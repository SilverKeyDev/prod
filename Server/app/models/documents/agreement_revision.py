import uuid
from datetime import datetime, timezone

from app import db


class AgreementRevision(db.Model):
    """Agreement revision - document versioning"""

    __tablename__ = "agreement_revisions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agreement_id = db.Column(
        db.String(36), db.ForeignKey("agreements.id"), nullable=False, index=True
    )
    version_number = db.Column(db.Integer, nullable=False)  # Auto-increment per agreement

    # Document storage
    file_path = db.Column(db.String(512), nullable=False)  # S3 key
    filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer)
    file_hash = db.Column(db.String(64), nullable=False)  # SHA-256 for integrity
    mime_type = db.Column(db.String(100), default="application/pdf")

    # Template info (if generated from template)
    template_id = db.Column(db.String(100), nullable=True)  # DocuSign template ID
    template_variables = db.Column(db.Text, nullable=True)  # JSON of filled variables

    # Metadata
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    notes = db.Column(db.Text, nullable=True)

    # Relationships
    agreement = db.relationship(
        "Agreement", back_populates="revisions", foreign_keys=[agreement_id]
    )
    creator = db.relationship("User", foreign_keys=[created_by])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "agreement_id": self.agreement_id,
            "version_number": self.version_number,
            "file_path": self.file_path,
            "filename": self.filename,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "mime_type": self.mime_type,
            "template_id": self.template_id,
            "template_variables": self.template_variables,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "notes": self.notes,
        }

    def __repr__(self):
        return f"<AgreementRevision {self.id} v{self.version_number}>"
