"""Per-brokerage SkySlope sync cursor and status."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column

from app import db

SKYSLOPE_SYNC_STATUS_IDLE = "idle"
SKYSLOPE_SYNC_STATUS_RUNNING = "running"
SKYSLOPE_SYNC_STATUS_FAILED = "failed"


class SkySlopeSyncState(db.Model):
    __tablename__ = "skyslope_sync_states"

    brokerage_id: Mapped[str] = mapped_column(
        db.String(36), db.ForeignKey("brokerage_orgs.id"), primary_key=True
    )
    status: Mapped[str] = mapped_column(
        db.String(32), nullable=False, default=SKYSLOPE_SYNC_STATUS_IDLE
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    last_full_sync_at: Mapped[datetime | None] = mapped_column(db.DateTime)
    sync_cursor: Mapped[str | None] = mapped_column(db.String(255))
    last_error: Mapped[str | None] = mapped_column(db.Text)
    records_imported_last_run: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
