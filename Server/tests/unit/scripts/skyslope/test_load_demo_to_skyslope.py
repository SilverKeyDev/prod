"""Tests for demo CSV → SkySlopeTransaction loader mapping."""

from __future__ import annotations

from scripts.skyslope.demo_to_skyslope_mapping import (
    build_skyslope_raw_from_demo,
    map_demo_deal_to_transaction_row,
)
from scripts.skyslope.generate_demo_dataset import generate_demo_dataset


def test_build_skyslope_raw_maps_core_fields() -> None:
    tables = generate_demo_dataset(seed=1, num_offices=1, num_agents=5, num_deals=5)
    deal = tables["deals"].iloc[0].to_dict()
    prop = (
        tables["properties"]
        .loc[tables["properties"]["property_id"] == deal["property_id"]]
        .iloc[0]
        .to_dict()
    )
    compliance = (
        tables["compliance"]
        .loc[tables["compliance"]["deal_id"] == deal["deal_id"]]
        .iloc[0]
        .to_dict()
    )

    raw = build_skyslope_raw_from_demo(deal, prop, compliance)

    assert raw["transactionId"] == deal["deal_id"]
    assert raw["propertyAddress"] == prop["address"]
    assert raw["side"] in {"buyer", "seller", "both"}
    assert raw["propertyType"] in {"residential", "land", None}
    assert raw["demoLeadSource"] == deal["lead_source"]
    if raw["demoRequiredDocs"]:
        assert raw["demoComplianceRate"] is not None


def test_map_demo_deal_produces_skyslope_transaction_kwargs() -> None:
    tables = generate_demo_dataset(seed=2, num_offices=1, num_agents=3, num_deals=3)
    deal = tables["deals"].iloc[0].to_dict()
    prop = tables["properties"].iloc[0].to_dict()
    compliance = tables["compliance"].iloc[0].to_dict()
    brokerage_id = "a0000000-0000-4000-8000-000000000001"

    row = map_demo_deal_to_transaction_row(
        deal, prop, brokerage_id=brokerage_id, compliance_row=compliance
    )

    assert row["brokerage_id"] == brokerage_id
    assert row["skyslope_transaction_id"] == deal["deal_id"]
    assert row["city"] == prop["city"]
    assert row["raw_payload"]["demoLeadSource"] == deal["lead_source"]
    assert row["agent_id"] is None


def test_load_demo_upsert_is_idempotent(app, db_session) -> None:
    import tempfile
    from pathlib import Path

    from sqlalchemy import func, select

    from app import db
    from app.models.skyslope import SkySlopeTransaction
    from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
    from scripts.skyslope.load_demo_to_skyslope import load_demo_to_skyslope

    tables = generate_demo_dataset(seed=3, num_offices=1, num_agents=4, num_deals=8)

    def _demo_deal_count() -> int:
        return int(
            db.session.scalar(
                select(func.count())
                .select_from(SkySlopeTransaction)
                .where(
                    SkySlopeTransaction.brokerage_id == DEFAULT_BROKERAGE_ORG_ID,
                    SkySlopeTransaction.skyslope_transaction_id.like("DEAL-%"),
                )
            )
            or 0
        )

    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp)
        tables["deals"].to_csv(out / "deals.csv", index=False)
        tables["properties"].to_csv(out / "properties.csv", index=False)
        tables["compliance"].to_csv(out / "compliance.csv", index=False)

        with app.app_context():
            first = load_demo_to_skyslope(
                DEFAULT_BROKERAGE_ORG_ID,
                out,
                batch_size=4,
                purge_demo=True,
            )
            second = load_demo_to_skyslope(
                DEFAULT_BROKERAGE_ORG_ID,
                out,
                batch_size=4,
                purge_demo=False,
            )

            assert first["created"] == 8
            assert first["updated"] == 0
            assert _demo_deal_count() == 8
            assert second["created"] == 0
            assert second["updated"] == 8
            assert _demo_deal_count() == 8
