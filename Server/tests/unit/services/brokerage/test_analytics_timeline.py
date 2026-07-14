"""Unit tests for brokerage analytics timeline helpers (SIL-274)."""

from __future__ import annotations

from datetime import datetime, timezone

from app.services.brokerage.analytics_timeline import (
    PERIOD_SCALE,
    VALID_TIMELINES,
    is_valid_timeline,
    period_scale,
    scale_int,
    timeline_to_date_range,
)


def test_period_scale_table_matches_canonical_contract():
    assert PERIOD_SCALE["week"] == 0.05
    assert PERIOD_SCALE["month"] == 1.0
    assert PERIOD_SCALE["year"] == 12.0
    assert PERIOD_SCALE["5years"] == 24.0
    assert PERIOD_SCALE["all"] == 24.0
    assert period_scale("week") < period_scale("month") < period_scale("year")
    assert period_scale("year") <= period_scale("all")
    assert period_scale(None) == 1.0


def test_timeline_to_date_range_day_spans():
    now = datetime(2026, 7, 12, 12, 0, 0, tzinfo=timezone.utc)
    spans = {
        "week": 7,
        "month": 30,
        "year": 365,
        "5years": 5 * 365,
        "all": 10 * 365,
    }
    for timeline, days in spans.items():
        start, end = timeline_to_date_range(timeline, now=now)
        assert end == now
        assert (end - start).days == days


def test_valid_timeline_allowlist():
    assert VALID_TIMELINES == frozenset({"week", "month", "year", "5years", "all"})
    assert is_valid_timeline("month")
    assert not is_valid_timeline("decade")
    assert not is_valid_timeline(None)


def test_scale_int_rounds_non_negative():
    assert scale_int(100, 0.05) == 5
    assert scale_int(1, 0.05) == 0
    assert scale_int(10, 12) == 120
