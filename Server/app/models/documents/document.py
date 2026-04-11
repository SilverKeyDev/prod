import warnings
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class Document(db.Model):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(db.String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"))
    library_item_id: Mapped[str | None] = mapped_column(
        db.ForeignKey("document_library_items.id"), unique=True
    )
    filename: Mapped[str] = mapped_column(db.String(255))
    file_path: Mapped[str] = mapped_column(db.String(512))
    file_size: Mapped[int | None] = mapped_column(db.Integer)  # Size in bytes
    status: Mapped[str] = mapped_column(
        db.String(20), default="uploaded"
    )  # uploaded, processing, processed, error

    # Report details
    address: Mapped[str | None] = mapped_column(db.Text)  # Optional property address
    document_type: Mapped[str] = mapped_column(
        db.String(20), default="detailed"
    )  # 'detailed' or 'standard'

    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("documents", lazy=True))
    library_item = db.relationship(
        "DocumentLibraryItem",
        back_populates="upload_document",
        foreign_keys=[library_item_id],
    )

    def to_dict(self):
        warnings.warn(
            "Document.to_dict() is deprecated; use app.dtos.document.WorkflowDocumentDTO.from_document",
            DeprecationWarning,
            stacklevel=2,
        )
        return {
            "id": self.id,
            "filename": self.filename,
            "file_size": self.file_size,
            "status": self.status,
            "address": self.address,
            "document_type": self.document_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Document {self.filename}>"
