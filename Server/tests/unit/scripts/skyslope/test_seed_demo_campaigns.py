"""Tests for seed_demo_campaigns validation helpers (no DB required for fee math)."""

from __future__ import annotations

from app.services.brokerage.ancillary_fees import ANCILLARY_FEES
from app.services.brokerage.campaigns.lift import attach_rate_lift_pp, recovered_dollars


def test_q1_story_math_with_shared_fees():
    baseline, post = 15.0, 19.0
    lift = attach_rate_lift_pp(baseline, post)
    assert 1.0 <= lift <= 5.0
    attaches = 56
    assert recovered_dollars(attaches, ANCILLARY_FEES["title"]) == 8400


def test_q2_story_math_with_shared_fees():
    lift = attach_rate_lift_pp(20.0, 22.0)
    assert 1.0 <= lift <= 5.0
    assert recovered_dollars(15, ANCILLARY_FEES["home_warranty"]) == 1125
