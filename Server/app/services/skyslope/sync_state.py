"""Read/write per-brokerage SkySlope sync state."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models.skyslope import (
    SKYSLOPE_SYNC_STATUS_FAILED,
    SKYSLOPE_SYNC_STATUS_IDLE,
    SKYSLOPE_SYNC_STATUS_RUNNING,
    SkySlopeSyncState,
)


def get_or_create_sync_state(brokerage_id: str) -> SkySlopeSyncState:
    row = db.session.scalar(
        select(SkySlopeSyncState).where(SkySlopeSyncState.brokerage_id == brokerage_id)
    )
    if row:
        return row
    row = SkySlopeSyncState(brokerage_id=brokerage_id)
    db.session.add(row)
    db.session.commit()
    return row


def mark_sync_running(brokerage_id: str) -> SkySlopeSyncState:
    row = get_or_create_sync_state(brokerage_id)
    row.status = SKYSLOPE_SYNC_STATUS_RUNNING
    row.last_error = None
    row.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return row


def mark_sync_success(
    brokerage_id: str,
    *,
    records_imported: int,
    full: bool,
    sync_cursor: str | None = None,
) -> None:
    now = datetime.now(timezone.utc)
    row = get_or_create_sync_state(brokerage_id)
    row.status = SKYSLOPE_SYNC_STATUS_IDLE
    row.last_synced_at = now
    if full:
        row.last_full_sync_at = now
    row.sync_cursor = sync_cursor
    row.records_imported_last_run = records_imported
    row.last_error = None
    row.updated_at = now
    db.session.commit()


def mark_sync_failed(brokerage_id: str, error_message: str) -> None:
    row = get_or_create_sync_state(brokerage_id)
    row.status = SKYSLOPE_SYNC_STATUS_FAILED
    row.last_error = error_message[:2000]
    row.updated_at = datetime.now(timezone.utc)
    db.session.commit()
