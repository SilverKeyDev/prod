"""Cross-stack scale parity — keep client PERIOD_SCALE and server PERIOD_SCALE aligned."""

from __future__ import annotations

from app.services.brokerage.analytics_timeline import PERIOD_SCALE

# Must match Client/packages/features/brokerage/utils/analyticsPeriod.ts PERIOD_SCALE
CLIENT_PERIOD_SCALE = {
    "week": 0.05,
    "month": 1,
    "year": 12,
    "5years": 24,
    "all": 24,
}


def test_server_period_scale_matches_client_contract():
    assert set(PERIOD_SCALE) == set(CLIENT_PERIOD_SCALE)
    for key, value in CLIENT_PERIOD_SCALE.items():
        assert PERIOD_SCALE[key] == float(value)
