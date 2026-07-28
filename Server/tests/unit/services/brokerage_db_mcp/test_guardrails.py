"""Unit tests for read-only SQL guardrails (SIL-323)."""

from __future__ import annotations

import pytest

from app.services.brokerage_db_mcp import QueryGuardrailError, validate_read_only_sql


def test_allows_simple_select_and_appends_limit():
    out = validate_read_only_sql(
        "SELECT agent_id, COUNT(*) AS n FROM skyslope_transactions GROUP BY agent_id"
    )
    assert out.lower().startswith("select")
    assert "limit 500" in out.lower()


def test_caps_existing_limit():
    out = validate_read_only_sql("SELECT 1 LIMIT 9999")
    assert out.lower().endswith("limit 500")


def test_caps_limit_preserves_offset():
    out = validate_read_only_sql("SELECT 1 LIMIT 9999 OFFSET 20")
    lowered = out.lower()
    assert "limit 500" in lowered
    assert "offset 20" in lowered
    assert lowered.index("limit 500") < lowered.index("offset 20")


def test_preserves_limit_when_within_cap():
    out = validate_read_only_sql("SELECT 1 LIMIT 10")
    assert out.lower().endswith("limit 10")


def test_preserves_limit_and_offset_when_within_cap():
    out = validate_read_only_sql("SELECT 1 LIMIT 10 OFFSET 5")
    lowered = out.lower()
    assert "limit 10" in lowered
    assert "offset 5" in lowered


def test_allows_with_cte():
    sql = """
    WITH closed AS (
      SELECT * FROM skyslope_transactions WHERE is_cancelled = false
    )
    SELECT agent_id, COUNT(*) FROM closed GROUP BY agent_id
    """
    out = validate_read_only_sql(sql)
    assert out.lower().lstrip().startswith("with")
    assert "limit" in out.lower()


@pytest.mark.parametrize(
    "sql",
    [
        "DELETE FROM skyslope_transactions",
        "UPDATE skyslope_transactions SET status = 'x'",
        "INSERT INTO skyslope_transactions (id) VALUES ('1')",
        "DROP TABLE skyslope_transactions",
        "ALTER TABLE skyslope_transactions ADD COLUMN x INT",
        "TRUNCATE skyslope_transactions",
        "SELECT 1; DELETE FROM skyslope_transactions",
        "SELECT * INTO tmp FROM skyslope_transactions",
    ],
)
def test_rejects_writes_and_ddl(sql: str):
    with pytest.raises(QueryGuardrailError):
        validate_read_only_sql(sql)


def test_rejects_empty():
    with pytest.raises(QueryGuardrailError) as exc:
        validate_read_only_sql("   ")
    assert exc.value.code == "empty_sql"


def test_rejects_comment_only():
    with pytest.raises(QueryGuardrailError):
        validate_read_only_sql("-- just a comment")


def test_comment_cannot_hide_second_statement():
    # After comment strip, still one SELECT — should pass
    out = validate_read_only_sql("SELECT 1 -- DELETE FROM t")
    assert "limit" in out.lower()

    # Real multi-statement still fails
    with pytest.raises(QueryGuardrailError) as exc:
        validate_read_only_sql("SELECT 1; DELETE FROM t")
    assert exc.value.code == "multiple_statements"
