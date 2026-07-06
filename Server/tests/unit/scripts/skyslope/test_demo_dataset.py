"""Tests for SIL-285 SkySlope demo dataset generator and validator."""

from __future__ import annotations

import pandas as pd

from scripts.skyslope.generate_demo_dataset import generate_demo_dataset
from scripts.skyslope.validate_demo_dataset import validate_demo_dataset


def test_generate_small_dataset_passes_validation() -> None:
    tables = generate_demo_dataset(seed=42, num_offices=3, num_agents=20, num_deals=200)
    result = validate_demo_dataset(**tables)

    assert result.passed, result.errors
    assert result.stats["offices"] == 3
    assert result.stats["agents"] == 20
    assert result.stats["deals"] == 200
    assert 0.05 <= result.stats["cancellation_rate_percent"] / 100 <= 0.25


def test_gci_formula_on_closed_deals() -> None:
    tables = generate_demo_dataset(seed=99, num_offices=2, num_agents=10, num_deals=80)
    deals = tables["deals"]
    closed = deals[deals["status"] == "closed"]

    assert len(closed) > 0
    for _, row in closed.iterrows():
        expected = round(
            float(row["sale_price"]) * float(row["commission_rate"]) * float(row["agent_split"]),
            2,
        )
        assert abs(float(row["gci"]) - expected) <= 0.02


def test_closed_deals_have_close_date_only() -> None:
    tables = generate_demo_dataset(seed=7, num_offices=2, num_agents=8, num_deals=60)
    deals = tables["deals"]

    closed = deals[deals["status"] == "closed"]
    assert closed["close_date"].notna().all()

    non_closed = deals[deals["status"] != "closed"]
    assert non_closed["close_date"].isna().all()


def test_reproducible_with_same_seed() -> None:
    a = generate_demo_dataset(seed=285, num_offices=2, num_agents=5, num_deals=30)
    b = generate_demo_dataset(seed=285, num_offices=2, num_agents=5, num_deals=30)

    assert a["deals"]["deal_id"].tolist() == b["deals"]["deal_id"].tolist()
    pd.testing.assert_series_equal(a["deals"]["gci"], b["deals"]["gci"], check_names=False)
