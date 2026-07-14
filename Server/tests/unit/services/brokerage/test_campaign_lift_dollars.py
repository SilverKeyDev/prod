"""Unit tests for campaign lift / recovered-dollar helpers + fee catalog parity."""

from __future__ import annotations

from app.services.brokerage.ancillary_fees import ANCILLARY_FEES, fee_for_service
from app.services.brokerage.campaigns.lift import (
    attach_rate_lift_pp,
    recovered_by_service_row,
    recovered_dollars,
)

# Mirror Client placement-share fees
CLIENT_FIXTURE_FEES = {
    "title": 150,
    "lending": 250,
    "escrow": 100,
    "home_warranty": 75,
}


def test_fee_catalog_matches_analytics_fixtures():
    for service, fee in CLIENT_FIXTURE_FEES.items():
        assert ANCILLARY_FEES[service] == fee
        assert fee_for_service(service) == fee


def test_attach_rate_lift_pp():
    assert attach_rate_lift_pp(22.0, 26.0) == 4.0
    assert attach_rate_lift_pp(30.0, 31.5) == 1.5


def test_recovered_dollars_matches_leakage_math():
    assert recovered_dollars(56, 150) == 8400
    assert recovered_dollars(0, 250) == 0


def test_recovered_by_service_row_uses_catalog():
    row = recovered_by_service_row("title", attributed_attaches=56, lift_pp=4.0)
    assert row["service"] == "title"
    assert row["fee_assumption"] == 150
    assert row["recovered_dollars"] == 8400
    assert row["lift_pp"] == 4.0
