from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.services.skyslope.mapping import map_skyslope_transaction

FIXTURE = Path(__file__).resolve().parents[3] / "fixtures" / "skyslope" / "sample_transaction.json"


@pytest.fixture
def sample_raw() -> dict:
    return json.loads(FIXTURE.read_text())


def test_map_skyslope_transaction_maps_core_fields(sample_raw):
    mapped = map_skyslope_transaction(sample_raw, brokerage_id="brokerage-1")

    assert mapped["brokerage_id"] == "brokerage-1"
    assert mapped["skyslope_transaction_id"] == "SS-1001"
    assert mapped["status"] == "closed"
    assert mapped["side"] == "buyer"
    assert mapped["property_type"] == "residential"
    assert mapped["sale_price"] == pytest.approx(525000)
    assert mapped["city"] == "Austin"
    assert mapped["raw_payload"] == sample_raw


def test_map_skyslope_transaction_requires_external_id():
    with pytest.raises(ValueError, match="transactionId"):
        map_skyslope_transaction({}, brokerage_id="brokerage-1")
