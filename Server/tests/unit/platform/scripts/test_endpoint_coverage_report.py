"""Tests for endpoint coverage report building."""

from __future__ import annotations

from scripts.endpoints.endpoint_coverage import build_coverage_report


def test_build_coverage_report_shapes_summary():
    inventory = ["GET /api/v1/foo", "POST /api/v1/bar"]
    observed = {"GET /api/v1/foo"}
    report = build_coverage_report(inventory, observed)

    assert report["inventory_count"] == 2
    assert report["observed_count"] == 1
    assert report["dead_endpoints"] == ["POST /api/v1/bar"]
    assert report["dead_count"] == 1
    assert report["observation_window_days"] == 7
