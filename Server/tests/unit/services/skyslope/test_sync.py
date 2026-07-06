from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pytest
from sqlalchemy import select

from app.models.skyslope import SKYSLOPE_SYNC_STATUS_IDLE, SkySlopeSyncState, SkySlopeTransaction
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.skyslope.client import MockSkySlopeClient
from app.services.skyslope.sync import sync_brokerage_transactions

FIXTURE = Path(__file__).resolve().parents[3] / "fixtures" / "skyslope" / "sample_transaction.json"


@pytest.fixture(autouse=True)
def _encryption_env(monkeypatch):
    monkeypatch.setenv("JWT_SIGNING_SECRET", "test-jwt-signing-secret-not-for-production")


def _mock_client():
    raw = json.loads(FIXTURE.read_text())
    return MockSkySlopeClient(pages=[[raw]])


def test_sync_is_idempotent_with_mock_client(app, db_session):
    with patch(
        "app.services.skyslope.credentials.get_decrypted_skyslope_api_key",
        return_value="sk-test",
    ):
        client = _mock_client()
        result1 = sync_brokerage_transactions(DEFAULT_BROKERAGE_ORG_ID, full=True, client=client)
        result2 = sync_brokerage_transactions(DEFAULT_BROKERAGE_ORG_ID, full=True, client=client)

    assert result1["created"] == 1
    assert result1["updated"] == 0
    assert result2["created"] == 0
    assert result2["updated"] == 1

    rows = db_session.session.scalars(select(SkySlopeTransaction)).all()
    assert len(rows) == 1

    state = db_session.session.scalar(
        select(SkySlopeSyncState).where(SkySlopeSyncState.brokerage_id == DEFAULT_BROKERAGE_ORG_ID)
    )
    assert state is not None
    assert state.status == SKYSLOPE_SYNC_STATUS_IDLE
    assert state.records_imported_last_run == 1
