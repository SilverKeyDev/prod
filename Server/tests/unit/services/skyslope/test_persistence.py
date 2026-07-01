from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import func, select

from app import db
from app.models.skyslope import SkySlopeTransaction
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.skyslope.mapping import map_skyslope_transaction
from app.services.skyslope.persistence import (
    count_skyslope_transactions,
    upsert_skyslope_transactions,
)

FIXTURE = Path(__file__).resolve().parents[3] / "fixtures" / "skyslope" / "sample_transaction.json"


def _mapped_row(**overrides):
    raw = json.loads(FIXTURE.read_text())
    raw.update(overrides)
    return map_skyslope_transaction(raw, brokerage_id=DEFAULT_BROKERAGE_ORG_ID)


def test_upsert_creates_then_updates_without_duplicates(app, db_session):
    row = _mapped_row()

    created, updated = upsert_skyslope_transactions(DEFAULT_BROKERAGE_ORG_ID, [row])
    assert created == 1
    assert updated == 0
    assert count_skyslope_transactions(DEFAULT_BROKERAGE_ORG_ID) == 1

    row2 = _mapped_row()
    row2["status"] = "archived"

    created2, updated2 = upsert_skyslope_transactions(DEFAULT_BROKERAGE_ORG_ID, [row2])
    assert created2 == 0
    assert updated2 == 1
    assert count_skyslope_transactions(DEFAULT_BROKERAGE_ORG_ID) == 1

    stored = db.session.scalar(
        select(SkySlopeTransaction).where(
            SkySlopeTransaction.brokerage_id == DEFAULT_BROKERAGE_ORG_ID,
            SkySlopeTransaction.skyslope_transaction_id == "SS-1001",
        )
    )
    assert stored is not None
    assert stored.status == "archived"


def test_upsert_multiple_rows(app, db_session):
    row_a = _mapped_row(transactionId="SS-A")
    row_b = _mapped_row(transactionId="SS-B")

    created, updated = upsert_skyslope_transactions(DEFAULT_BROKERAGE_ORG_ID, [row_a, row_b])
    assert created == 2
    assert updated == 0

    total = db.session.scalar(select(func.count()).select_from(SkySlopeTransaction))
    assert total == 2
