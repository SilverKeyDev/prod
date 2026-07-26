"""Unit tests for brokerage DB connection config (SIL-323)."""

from __future__ import annotations

import pytest

from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.brokerage_db_mcp import (
    MODE_SILVERKEY_MIRROR,
    ConnectionConfigError,
    resolve_connection_config,
)


def test_resolve_mirror_config_for_default_org(app, db_session):
    cfg = resolve_connection_config(DEFAULT_BROKERAGE_ORG_ID)
    assert cfg.brokerage_org_id == DEFAULT_BROKERAGE_ORG_ID
    assert cfg.mode == MODE_SILVERKEY_MIRROR
    assert "skyslope_transactions" in cfg.allowed_tables
    assert cfg.tenancy_column == "brokerage_id"


def test_resolve_rejects_empty_id(app, db_session):
    with pytest.raises(ConnectionConfigError) as exc:
        resolve_connection_config("  ")
    assert exc.value.code == "missing_brokerage_org_id"


def test_resolve_rejects_unknown_org(app, db_session):
    with pytest.raises(ConnectionConfigError) as exc:
        resolve_connection_config("00000000-0000-4000-8000-000000000099")
    assert exc.value.code == "brokerage_not_found"
