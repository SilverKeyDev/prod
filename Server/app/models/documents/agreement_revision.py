import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class AgreementRevision(db.Model):
    """Agreement revision - document versioning"""

    __tablename__ = "agreement_revisions"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agreement_id: Mapped[str] = mapped_column(db.ForeignKey("agreements.id"), index=True)
    version_number: Mapped[int] = mapped_column(db.Integer)  # Auto-increment per agreement

    # Document storage
    file_path: Mapped[str] = mapped_column(db.String(512))  # S3 key
    filename: Mapped[str] = mapped_column(db.String(255))
    file_size: Mapped[int | None] = mapped_column(db.Integer)
    file_hash: Mapped[str] = mapped_column(db.String(64))  # SHA-256 for integrity
    mime_type: Mapped[str] = mapped_column(db.String(100), default="application/pdf")

    # Template info (if generated from template)
    template_id: Mapped[str | None] = mapped_column(db.String(100))  # DocuSign template ID
    template_variables: Mapped[str | None] = mapped_column(db.Text)  # JSON of filled variables

    # Metadata
    created_by: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    notes: Mapped[str | None] = mapped_column(db.Text)

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
