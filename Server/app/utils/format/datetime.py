"""UTC-aware datetime serialization for API and Pydantic ``AwareDatetime`` fields."""

from __future__ import annotations

from datetime import datetime, timezone


def to_aware_utc_iso(dt: datetime | None) -> str | None:
    """Return an ISO-8601 string with UTC offset, suitable for naive DB datetimes."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()
