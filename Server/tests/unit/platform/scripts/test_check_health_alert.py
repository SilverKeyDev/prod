"""Tests for scripts/ops/check_health_alert.py."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[5] / "scripts/ops/check_health_alert.py"
SPEC = importlib.util.spec_from_file_location("check_health_alert", SCRIPT_PATH)
assert SPEC and SPEC.loader
check_health_alert = importlib.util.module_from_spec(SPEC)
sys.modules["check_health_alert"] = check_health_alert
SPEC.loader.exec_module(check_health_alert)


def test_build_health_alert_text_contains_failure_context() -> None:
    result = check_health_alert.HealthCheckResult(
        ok=False,
        status_code=503,
        elapsed_ms=120,
        detail='{"status":"error"}',
    )

    text = check_health_alert.build_alert_text(
        service_name="SilverKey staging",
        health_url="https://staging.example.com/healthz",
        result=result,
    )

    assert "SilverKey staging health check failed" in text
    assert "https://staging.example.com/healthz" in text
    assert "Status: 503" in text
    assert "Latency: 120ms" in text
