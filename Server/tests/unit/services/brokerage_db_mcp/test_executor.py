"""Unit tests for read-only query execution (SIL-323)."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app import db
from app.models.skyslope import SkySlopeTransaction
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.brokerage_db_mcp import (
    QueryExecutionError,
    QueryGuardrailError,
    execute_readonly,
    resolve_connection_config,
)

OTHER_BROKERAGE_ID = "b0000000-0000-4000-8000-000000000099"


def _seed_tx(*, brokerage_id: str, external_id: str, agent_id: str | None = "agent-1") -> None:
    db.session.add(
        SkySlopeTransaction(
            brokerage_id=brokerage_id,
            skyslope_transaction_id=external_id,
            agent_id=agent_id,
            status="closed",
            closed_at=datetime(2026, 4, 15, tzinfo=timezone.utc),
            is_cancelled=False,
            sale_price=Decimal("450000.00"),
        )
    )
    db.session.commit()


def test_execute_returns_tenant_scoped_rows(app, db_session):
    _seed_tx(brokerage_id=DEFAULT_BROKERAGE_ORG_ID, external_id="SS-A1")
    _seed_tx(brokerage_id=DEFAULT_BROKERAGE_ORG_ID, external_id="SS-A2", agent_id="agent-2")
    # Same shape, different tenant — must not appear
    _seed_tx(brokerage_id=OTHER_BROKERAGE_ID, external_id="SS-OTHER")

    # OTHER org is not in BrokerageOrg table; we only query DEFAULT via config.
    cfg = resolve_connection_config(DEFAULT_BROKERAGE_ORG_ID)
    result = execute_readonly(
        cfg,
        """
        SELECT agent_id, COUNT(*) AS closed_count
        FROM skyslope_transactions
        WHERE is_cancelled = 0
        GROUP BY agent_id
        """,
    )

    assert result.row_count >= 1
    assert "agent_id" in result.columns
    assert "closed_count" in result.columns
    # Tenancy: only default org rows (2), not OTHER
    total = sum(int(r["closed_count"]) for r in result.rows)
    assert total == 2
    assert ":brokerage_org_id" in result.sql
    assert "AS _sk_raw" in result.sql


@pytest.mark.parametrize(
    "bypass_sql",
    [
        # Substring-only checks would pass these; enforced rewrite must not leak.
        """
        SELECT * FROM skyslope_transactions
        WHERE 'brokerage_id' IS NOT NULL
          AND CAST(:brokerage_org_id AS text) IS NOT NULL
        """,
        """
        SELECT * FROM skyslope_transactions
        WHERE 1=1 OR brokerage_id = :brokerage_org_id
        """,
        """
        SELECT * FROM skyslope_transactions
        WHERE brokerage_id = brokerage_id
          AND :brokerage_org_id IS NOT NULL
        """,
    ],
)
def test_tenancy_bypass_shapes_return_zero_foreign_rows(app, db_session, bypass_sql: str):
    _seed_tx(brokerage_id=DEFAULT_BROKERAGE_ORG_ID, external_id="SS-OURS")
    _seed_tx(brokerage_id=OTHER_BROKERAGE_ID, external_id="SS-OTHER")

    cfg = resolve_connection_config(DEFAULT_BROKERAGE_ORG_ID)
    result = execute_readonly(cfg, bypass_sql)

    assert result.row_count == 1
    assert all(r.get("brokerage_id") == DEFAULT_BROKERAGE_ORG_ID for r in result.rows)
    assert all(r.get("skyslope_transaction_id") != "SS-OTHER" for r in result.rows)


def test_rejects_delete_before_execute(app, db_session):
    cfg = resolve_connection_config(DEFAULT_BROKERAGE_ORG_ID)
    with pytest.raises(QueryGuardrailError):
        execute_readonly(cfg, "DELETE FROM skyslope_transactions")


def test_rejects_non_allowlisted_table(app, db_session):
    cfg = resolve_connection_config(DEFAULT_BROKERAGE_ORG_ID)
    with pytest.raises(QueryExecutionError) as exc:
        execute_readonly(
            cfg,
            "SELECT id FROM users WHERE brokerage_id = :brokerage_org_id",
        )
    assert exc.value.code == "table_not_allowed"
