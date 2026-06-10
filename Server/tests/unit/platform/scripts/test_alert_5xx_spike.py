"""Tests for Server/scripts/monitoring/alert_5xx_spike.py."""

from __future__ import annotations

from scripts.monitoring.alert_5xx_spike import build_alert_text, build_hogql


def test_build_hogql_uses_api_request_5xx_window() -> None:
    query = build_hogql(window_minutes=3)

    assert "event = 'api_request'" in query
    assert "properties.status_code >= 500" in query
    assert "INTERVAL 3 MINUTE" in query


def test_build_alert_text_contains_threshold_context() -> None:
    text = build_alert_text(
        service_name="SilverKey staging",
        count=7,
        threshold=3,
        window_minutes=1,
    )

    assert "SilverKey staging 5xx spike detected" in text
    assert "5xx count: 7" in text
    assert "Threshold: 3" in text
    assert "Window: 1 minute" in text
