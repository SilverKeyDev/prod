"""Read-only SQL guardrails for brokerage DB NL / query path (SIL-323).
Rejects DDL/DML and multi-statements. Caps row count via LIMIT.
Does not execute SQL - callers run the returned string under a read-only session.
"""

from __future__ import annotations

import re

from app.services.brokerage_db_mcp.errors import QueryGuardrailError

DEFAULT_MAX_LIMIT = 500

_BANNED_KEYWORDS = frozenset(
    {
        "insert",
        "update",
        "delete",
        "drop",
        "alter",
        "create",
        "truncate",
        "grant",
        "revoke",
        "copy",
        "execute",
        "exec",
        "call",
        "merge",
        "replace",
        "attach",
        "detach",
        "vacuum",
        "analyze",  # Postgres ANALYZE is fine as verb but block standalone misuse; keep
        "reindex",
        "cluster",
        "comment",  # COMMENT ON …
        "security",  # SECURITY DEFINER style abuse via SET ROLE often uses SET — see below
    }
)
# Also block session / write-adjacent commands often used to escalate
_BANNED_PHRASES = (
    "into outfile",
    "into dumpfile",
    "for update",
    "skip locked",
    "pg_read_file",
    "pg_write_file",
    "lo_import",
    "lo_export",
    "dblink",
)
_COMMENT_LINE = re.compile(r"--.*?$", re.MULTILINE)
_COMMENT_BLOCK = re.compile(r"/\*.*?\*/", re.DOTALL)
_LIMIT_CLAUSE = re.compile(
    r"\blimit\s+(\d+)(\s+offset\s+(\d+))?\s*;?\s*$",
    re.IGNORECASE,
)
_TOKEN = re.compile(r"[a-z_][a-z0-9_]*", re.IGNORECASE)


def _strip_comments(sql: str) -> str:
    sql = _COMMENT_BLOCK.sub(" ", sql)
    sql = _COMMENT_LINE.sub(" ", sql)
    return sql


def _split_statements(sql: str) -> list[str]:
    """Split on semicolons outside single-quoted strings (simple scanner)."""
    parts: list[str] = []
    buf: list[str] = []
    in_single = False
    i = 0
    while i < len(sql):
        ch = sql[i]
        if ch == "'" and not in_single:
            in_single = True
            buf.append(ch)
            i += 1
            continue
        if ch == "'" and in_single:
            # handle escaped '' inside string
            if i + 1 < len(sql) and sql[i + 1] == "'":
                buf.append("''")
                i += 2
                continue
            in_single = False
            buf.append(ch)
            i += 1
            continue
        if ch == ";" and not in_single:
            part = "".join(buf).strip()
            if part:
                parts.append(part)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return parts


def _tokens(sql: str) -> list[str]:
    return [m.group(0).lower() for m in _TOKEN.finditer(sql)]


def _ensure_limit(sql: str, max_limit: int) -> str:
    match = _LIMIT_CLAUSE.search(sql)
    if match:
        limit_val = int(match.group(1))
        offset_clause = f" OFFSET {match.group(3)}" if match.group(3) is not None else ""
        if limit_val > max_limit:
            # Cap LIMIT but preserve OFFSET when present.
            sql = sql[: match.start()] + f"LIMIT {max_limit}{offset_clause}"
        return sql.rstrip().rstrip(";")
    return f"{sql.rstrip().rstrip(';')} LIMIT {max_limit}"


def validate_read_only_sql(sql: str, *, max_limit: int = DEFAULT_MAX_LIMIT) -> str:
    """Validate and return a single SELECT/WITH…SELECT with enforced LIMIT.
    Raises:
        QueryGuardrailError: if empty, multi-statement, non-SELECT, or banned ops.
    """
    if max_limit < 1:
        raise QueryGuardrailError("max_limit must be >= 1", code="invalid_limit")
    if not isinstance(sql, str) or not sql.strip():
        raise QueryGuardrailError("SQL is empty", code="empty_sql")
    cleaned = _strip_comments(sql).strip()
    if not cleaned:
        raise QueryGuardrailError("SQL is empty after removing comments", code="empty_sql")
    statements = _split_statements(cleaned)
    if len(statements) != 1:
        raise QueryGuardrailError(
            "Only a single SQL statement is allowed",
            code="multiple_statements",
        )
    statement = statements[0]
    lowered = statement.lower()

    for phrase in _BANNED_PHRASES:
        if phrase in lowered:
            raise QueryGuardrailError(
                f"Disallowed SQL phrase: {phrase}",
                code="banned_phrase",
            )

    tokens = _tokens(statement)
    if not tokens:
        raise QueryGuardrailError("SQL has no tokens", code="empty_sql")

    if tokens[0] not in {"select", "with"}:
        raise QueryGuardrailError(
            "Only SELECT (or WITH … SELECT) queries are allowed",
            code="not_select",
        )

    # SELECT … INTO is a write-shaped form in some engines
    if "into" in tokens and tokens[0] == "select":
        # allow column aliases like "into" as identifier? rare — fail closed
        raise QueryGuardrailError("SELECT INTO is not allowed", code="select_into")
    banned_hit = _BANNED_KEYWORDS.intersection(tokens)
    # "with" / "select" are fine; "replace" might appear as identifier — fail closed on keyword set
    if banned_hit:
        raise QueryGuardrailError(
            f"Disallowed SQL keyword(s): {', '.join(sorted(banned_hit))}",
            code="banned_keyword",
        )

    return _ensure_limit(statement, max_limit)
