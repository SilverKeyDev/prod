"""Unified library row for file uploads and DocuSign agreements (listing scope: user_id)."""

# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class DocumentLibraryItem(db.Model):
    """
    Single logical type for Saved / documents list.
    kind='upload' — linked Document row via documents.library_item_id.
    kind='agreement' — linked Agreement row via agreements.library_item_id.
    """

    __tablename__ = "document_library_items"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(db.ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(db.String(20))  # upload | agreement
    title: Mapped[str] = mapped_column(db.String(512))
    display_status: Mapped[str] = mapped_column(db.String(50))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    upload_document = db.relationship(
        "Document",
        back_populates="library_item",
        uselist=False,
        foreign_keys="Document.library_item_id",
    )
    agreement = db.relationship(
        "Agreement",
        back_populates="library_item",
        uselist=False,
        foreign_keys="Agreement.library_item_id",
    )

    def to_list_dict(self) -> dict[str, Any]:
        return {
            "library_item_id": self.id,
            "kind": self.kind,
            "title": self.title,
            "display_status": self.display_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user_id": self.user_id,
        }

    def __repr__(self) -> str:
        return f"<DocumentLibraryItem {self.id} {self.kind}>"
