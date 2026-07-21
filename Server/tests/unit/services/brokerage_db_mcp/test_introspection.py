"""Unit tests for brokerage DB schema introspection (SIL-323)."""

from __future__ import annotations

from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.brokerage_db_mcp import (
    introspect_schema,
    resolve_connection_config,
)


def test_introspect_skyslope_transactions_columns(app, db_session):
    cfg = resolve_connection_config(DEFAULT_BROKERAGE_ORG_ID)
    snap = introspect_schema(cfg)

    assert snap.brokerage_org_id == DEFAULT_BROKERAGE_ORG_ID
    assert len(snap.tables) == 1
    table = snap.tables[0]
    assert table.name == "skyslope_transactions"

    names = {c.name for c in table.columns}
    # Must discover live columns — not a hardcoded product schema dump
    assert "brokerage_id" in names
    assert "closed_at" in names
    assert "sale_price" in names
    assert "agent_id" in names
    assert "status" in names


def test_prompt_text_includes_table(app, db_session):
    cfg = resolve_connection_config(DEFAULT_BROKERAGE_ORG_ID)
    text = introspect_schema(cfg).prompt_text()
    assert "skyslope_transactions" in text
    assert "brokerage_id" in text
