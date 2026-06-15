"""Shared helpers for agent conversation message operations."""

from datetime import datetime, timezone

MAX_HISTORY_PAGE_LIMIT = 100
DEFAULT_OLDER_PAGE_LIMIT = 10
DEFAULT_NEWER_PAGE_LIMIT = 50


def normalize_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
