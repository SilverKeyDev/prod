"""Canonical brokerage analytics timeline helpers (SIL-274).

Mirrors Client/packages/features/brokerage/utils/analyticsPeriod.ts PERIOD_SCALE
and date-range mapping so fixture/stub scaling stays aligned across stacks.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

VALID_TIMELINES = frozenset({"week", "month", "year", "5years", "all"})

# Month = 1.0 baseline — keep in sync with client PERIOD_SCALE.
PERIOD_SCALE: dict[str, float] = {
    "week": 0.05,
    "month": 1.0,
    "year": 12.0,
    "5years": 24.0,
    "all": 24.0,
}

_PERIOD_DAYS: dict[str, int] = {
    "week": 7,
    "month": 30,
    "year": 365,
    "5years": 5 * 365,
    "all": 10 * 365,
}


def is_valid_timeline(value: str | None) -> bool:
    return value is not None and value in VALID_TIMELINES


def period_scale(timeline: str | None) -> float:
    """Return scale factor; default month=1 when timeline unset."""
    if timeline is None:
        return PERIOD_SCALE["month"]
    return PERIOD_SCALE.get(timeline, PERIOD_SCALE["month"])


def timeline_to_date_range(
    timeline: str,
    now: datetime | None = None,
) -> tuple[datetime, datetime]:
    """Map timeline enum to UTC [date_from, date_to]."""
    if timeline not in VALID_TIMELINES:
        raise ValueError(f"Invalid timeline: {timeline}")
    end = now or datetime.now(timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    start = end - timedelta(days=_PERIOD_DAYS[timeline])
    return start, end


def default_range() -> tuple[datetime, datetime]:
    """Legacy default when neither timeline nor dates are provided (30 days)."""
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)
    return start, end


def scale_int(value: int | float, scale: float) -> int:
    return max(0, round(value * scale))


def scale_money(value: int | float, scale: float) -> int:
    return max(0, round(value * scale))
