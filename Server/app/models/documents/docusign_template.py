# pyright: reportUndefinedVariable=false
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class DocusignTemplate(db.Model):
    """DocuSign template cache"""

    __tablename__ = "docusign_templates"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # DocuSign fields
    docusign_template_id: Mapped[str] = mapped_column(db.String(100), unique=True)
    name: Mapped[str] = mapped_column(db.String(255))
    description: Mapped[str | None] = mapped_column(db.Text)

    # Metadata
    template_variables: Mapped[str | None] = mapped_column(db.Text)  # JSON schema of variables
    category: Mapped[str | None] = mapped_column(
        db.String(50)
    )  # offer, inspection, financing, etc.

    # Sync tracking
    synced_at: Mapped[datetime] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    is_active: Mapped[bool] = mapped_column(default=True)

    # SilverKey-authored template metadata (optional)
    created_by_user_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True
    )
    role_names_json: Mapped[str | None] = mapped_column(db.Text)
    last_edit_synced_at: Mapped[datetime | None] = mapped_column(db.DateTime)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def __repr__(self):
        return f"<DocusignTemplate {self.name}>"
