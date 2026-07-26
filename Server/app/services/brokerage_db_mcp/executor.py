"""Bounded read-only SQL execution for silverkey_mirror (SIL-323)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import text

from app import db
from app.services.brokerage_db_mcp.connection import (
    MODE_SILVERKEY_MIRROR,
    BrokerageDbConfig,
)
from app.services.brokerage_db_mcp.errors import QueryExecutionError, QueryGuardrailError
from app.services.brokerage_db_mcp.guardrails import DEFAULT_MAX_LIMIT, validate_read_only_sql

# FROM / JOIN table names (simple; good enough for v1 allowlist gate)
_TABLE_REF = re.compile(
    r"\b(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class QueryResult:
    sql: str
    columns: tuple[str, ...]
    rows: tuple[dict[str, Any], ...]
    row_count: int


def _referenced_tables(sql: str) -> set[str]:
    return {m.group(1).lower() for m in _TABLE_REF.finditer(sql)}


def _assert_allowlisted_tables(sql: str, config: BrokerageDbConfig) -> None:
    allowed = {t.lower() for t in config.allowed_tables}
    refs = _referenced_tables(sql)
    if not refs:
        raise QueryExecutionError(
            "Query must reference an allowlisted table",
            code="no_table",
        )
    unknown = refs - allowed
    if unknown:
        raise QueryExecutionError(
            "Query references tables that are not allowed",
            code="table_not_allowed",
        )


def _assert_mirror_tenancy(sql: str, config: BrokerageDbConfig) -> None:
    if config.mode != MODE_SILVERKEY_MIRROR:
        raise QueryExecutionError("Unsupported connection mode", code="unsupported_mode")
    if not config.tenancy_column:
        raise QueryExecutionError("Tenancy column is not configured", code="tenancy_missing")
    lowered = sql.lower()
    # Must filter by tenancy column and use the bound param name we will pass.
    if config.tenancy_column.lower() not in lowered:
        raise QueryExecutionError(
            "Query must filter by brokerage tenancy column",
            code="tenancy_predicate_missing",
        )
    if ":brokerage_org_id" not in sql:
        raise QueryExecutionError(
            "Query must bind :brokerage_org_id for tenancy",
            code="tenancy_bind_missing",
        )


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime | date):
        return value.isoformat()
    if isinstance(value, bytes):
        return None  # never leak binary blobs
    return value


def execute_readonly(
    config: BrokerageDbConfig,
    sql: str,
    *,
    max_limit: int = DEFAULT_MAX_LIMIT,
) -> QueryResult:
    """Validate and execute a single read-only SELECT for this brokerage."""
    try:
        safe_sql = validate_read_only_sql(sql, max_limit=max_limit)
    except QueryGuardrailError:
        raise
    _assert_allowlisted_tables(safe_sql, config)
    _assert_mirror_tenancy(safe_sql, config)
    params = {"brokerage_org_id": config.brokerage_org_id}
    try:
        result = db.session.execute(text(safe_sql), params)
        mappings = result.mappings().all()
    except QueryGuardrailError:
        raise
    except Exception as exc:  # noqa: BLE001 — sanitize all DB/driver errors
        # Log server-side with real exc if you wire logger later; client message stays boring.
        raise QueryExecutionError(
            "Query execution failed",
            code="execution_failed",
        ) from exc
    if not mappings:
        return QueryResult(sql=safe_sql, columns=(), rows=(), row_count=0)
    columns = tuple(mappings[0].keys())
    rows = tuple({col: _json_safe(row[col]) for col in columns} for row in mappings)
    return QueryResult(
        sql=safe_sql,
        columns=columns,
        rows=rows,
        row_count=len(rows),
    )
