"""Unit tests for NL → SQL orchestration (SIL-323)."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app import db
from app.models.skyslope import SkySlopeTransaction
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.brokerage_db_mcp import (
    NlQueryError,
    QueryGuardrailError,
    run_nl_query,
)
from app.services.brokerage_db_mcp.introspection import SchemaSnapshot


def _seed_closed(*, external_id: str, agent_id: str, closed_at: datetime) -> None:
    db.session.add(
        SkySlopeTransaction(
            brokerage_id=DEFAULT_BROKERAGE_ORG_ID,
            skyslope_transaction_id=external_id,
            agent_id=agent_id,
            status="closed",
            closed_at=closed_at,
            is_cancelled=False,
            sale_price=Decimal("400000.00"),
        )
    )
    db.session.commit()


def _acceptance_sql_generator(question: str, schema: SchemaSnapshot) -> dict:
    """Deterministic stand-in for the LLM (acceptance question)."""
    assert "skyslope_transactions" in schema.prompt_text()
    assert "closed" in question.lower() or "agent" in question.lower()
    return {
        "sql": """
            SELECT agent_id, COUNT(*) AS closed_count
            FROM skyslope_transactions
            WHERE brokerage_id = :brokerage_org_id
              AND is_cancelled = 0
              AND closed_at >= '2026-01-01'
              AND closed_at < '2026-04-01'
            GROUP BY agent_id
        """,
        "viz_hint": "bar",
    }


def test_closed_transactions_by_agent_last_quarter(app, db_session):
    # "Last quarter" relative to mid-2026 ≈ Q1 2026 in the fake generator window
    _seed_closed(
        external_id="SS-Q1-1",
        agent_id="agent-a",
        closed_at=datetime(2026, 2, 10, tzinfo=timezone.utc),
    )
    _seed_closed(
        external_id="SS-Q1-2",
        agent_id="agent-a",
        closed_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
    )
    _seed_closed(
        external_id="SS-OLD",
        agent_id="agent-b",
        closed_at=datetime(2025, 6, 1, tzinfo=timezone.utc),
    )

    result = run_nl_query(
        DEFAULT_BROKERAGE_ORG_ID,
        "closed transactions by agent last quarter",
        sql_generator=_acceptance_sql_generator,
    )

    assert result.viz_hint == "bar"
    assert "limit" in result.sql.lower()
    assert ":brokerage_org_id" in result.sql or "brokerage_id" in result.sql.lower()
    assert result.row_count >= 1
    by_agent = {r["agent_id"]: int(r["closed_count"]) for r in result.rows}
    assert by_agent.get("agent-a") == 2
    assert "agent-b" not in by_agent


def test_nl_blocks_write_sql_from_generator(app, db_session):
    def evil_generator(question: str, schema: SchemaSnapshot) -> dict:
        return {"sql": "DELETE FROM skyslope_transactions", "viz_hint": "none"}

    with pytest.raises(QueryGuardrailError):
        run_nl_query(
            DEFAULT_BROKERAGE_ORG_ID,
            "delete everything",
            sql_generator=evil_generator,
        )


def test_empty_question_rejected(app, db_session):
    with pytest.raises(NlQueryError) as exc:
        run_nl_query(DEFAULT_BROKERAGE_ORG_ID, "  ", sql_generator=_acceptance_sql_generator)
    assert exc.value.code == "empty_question"
