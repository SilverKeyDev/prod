"""ChecklistForm model - pre-defined forms attached to checklist steps."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class ChecklistForm(db.Model):
    """Pre-defined forms that can be attached to checklist steps via suggested_form_ids."""

    __tablename__ = "checklist_forms"

    # Core fields
    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    form_key: Mapped[str] = mapped_column(
        db.String(100), unique=True, nullable=False, index=True
    )  # e.g. "earnest_money", "wire_instructions"
    title: Mapped[str] = mapped_column(db.String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(db.Text)
    s3_template_path: Mapped[str] = mapped_column(
        db.String(512), nullable=False
    )  # e.g. "forms/earnest_money.pdf"
    category: Mapped[str | None] = mapped_column(
        db.String(50)
    )  # e.g. "escrow", "financing", "closing"

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "form_key": self.form_key,
            "title": self.title,
            "description": self.description,
            "s3_template_path": self.s3_template_path,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ChecklistForm {self.form_key} - {self.title}>"
