"""Natural language → guarded SQL → result set (SIL-323)."""

from __future__ import annotations

import json
import os
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Literal

from openai import OpenAI

from app.config.llm_models import openai_chat_token_limit_params, openai_model_feature_overlap
from app.services.brokerage_db_mcp.connection import resolve_connection_config
from app.services.brokerage_db_mcp.errors import (
    NlQueryError,
    QueryExecutionError,
    QueryGuardrailError,
)
from app.services.brokerage_db_mcp.executor import QueryResult, execute_readonly
from app.services.brokerage_db_mcp.introspection import SchemaSnapshot, introspect_schema
from logger import log

VizHint = Literal["bar", "table", "none"]
SqlGenerator = Callable[[str, SchemaSnapshot], dict[str, Any]]


@dataclass(frozen=True)
class NlQueryResult:
    question: str
    sql: str
    viz_hint: VizHint
    columns: tuple[str, ...]
    rows: tuple[dict[str, Any], ...]
    row_count: int


_SYSTEM = """You convert brokerage analytics questions into a single read-only SQL query.
Rules:
- Output JSON only: {"sql": "...", "viz_hint": "bar"|"table"|"none"}
- One statement only. SELECT or WITH ... SELECT.
- Use ONLY tables/columns from the provided schema.
- Always include: WHERE brokerage_id = :brokerage_org_id (bind param exact name).
- Never INSERT/UPDATE/DELETE/DDL.
- Prefer aggregates for "by agent" questions (GROUP BY agent_id).
- For "last quarter", filter closed_at to the previous calendar quarter relative to UTC today.
- SQLite-compatible SQL when dialect is sqlite; otherwise Postgres-compatible.
- viz_hint=bar when result is label + numeric (e.g. agent_id, count); else table.
"""


def _safe_json_parse(s: str) -> dict[str, Any]:
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        start, end = s.find("{"), s.rfind("}")
        if start != -1 and end > start:
            try:
                return json.loads(s[start : end + 1])
            except json.JSONDecodeError:
                pass
        return {}


def _normalize_viz_hint(raw: Any) -> VizHint:
    value = str(raw or "table").strip().lower()
    if value in {"bar", "table", "none"}:
        return value  # type: ignore[return-value]
    return "table"


def build_nl_user_prompt(question: str, schema: SchemaSnapshot) -> str:
    return (
        f"Dialect: {schema.mode}\nSchema:\n{schema.prompt_text()}\n\nQuestion: {question.strip()}\n"
    )


def generate_sql_with_openai(question: str, schema: SchemaSnapshot) -> dict[str, Any]:
    """Live LLM path — used in prod; tests should inject a fake SqlGenerator instead."""
    api_key = os.getenv("OPENAI_KEY")
    if not api_key:
        raise NlQueryError("LLM is not configured", code="llm_unconfigured")
    client = OpenAI(api_key=api_key)
    model = openai_model_feature_overlap()

    def _request():
        return client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": build_nl_user_prompt(question, schema)},
            ],
            **openai_chat_token_limit_params(model, 800),
        )

    try:
        resp = _request()
    except Exception as exc:  # noqa: BLE001
        log.error("API", "Brokerage NL SQL generation failed", {"error": type(exc).__name__})
        raise NlQueryError("Failed to generate SQL", code="llm_failed") from exc

    content = (resp.choices[0].message.content or "").strip()
    parsed = _safe_json_parse(content)
    if not parsed.get("sql"):
        raise NlQueryError("LLM returned no SQL", code="llm_empty_sql")
    return parsed


def run_nl_query(
    brokerage_org_id: str,
    question: str,
    *,
    sql_generator: SqlGenerator | None = None,
) -> NlQueryResult:
    """Plan + execute a natural-language analytics question for one brokerage."""
    q = (question or "").strip()
    if not q:
        raise NlQueryError("Question is required", code="empty_question")
    config = resolve_connection_config(brokerage_org_id)
    schema = introspect_schema(config)
    generator = sql_generator or generate_sql_with_openai

    try:
        planned = generator(q, schema)
    except NlQueryError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise NlQueryError("SQL planning failed", code="plan_failed") from exc

    sql = str(planned.get("sql") or "").strip()
    if not sql:
        raise NlQueryError("Planned SQL is empty", code="empty_sql")

    viz_hint = _normalize_viz_hint(planned.get("viz_hint"))

    try:
        result: QueryResult = execute_readonly(config, sql)
    except (QueryGuardrailError, QueryExecutionError):
        log.warn("SECURITY", "Brokerage NL query blocked or failed execution", {})
        raise

    return NlQueryResult(
        question=q,
        sql=result.sql,
        viz_hint=viz_hint,
        columns=result.columns,
        rows=result.rows,
        row_count=result.row_count,
    )
