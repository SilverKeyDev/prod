#!/usr/bin/env python3
"""Regenerate docs/postgres/schema.md and relationships.md from SQLAlchemy metadata.

Run from Server/:
  cd Server && python scripts/postgres/export_postgres_docs.py

Uses the same import path as the Flask app (config loaded via create_app).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_SERVER = Path(__file__).resolve().parents[2]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))

_REPO = _SERVER.parent
_DOCS = _REPO / "docs" / "postgres"


def _col_type(col) -> str:
    try:
        return str(col.type)
    except Exception:
        return repr(col.type)


def _emit_schema_md(tables: list) -> str:
    lines: list[str] = [
        "# PostgreSQL schema (SilverKey)",
        "",
        "Generated from SQLAlchemy models (`Server/app/models/`) via "
        "`Server/scripts/postgres/export_postgres_docs.py`. "
        "Compare with live Postgres using `psql \"$DATABASE_URL\" -c '\\d+ table_name'`.",
        "",
        "Column **Default** shows Python `callable` for ORM-side defaults (actual SQL defaults appear "
        "under **server_default** in the model when present).",
        "",
    ]
    for table in tables:
        lines.append(f"## `{table.name}`")
        lines.append("")
        lines.append("| Column | Type | Nullable | Default |")
        lines.append("| --- | --- | --- | --- |")
        for col in table.columns:
            default = ""
            if col.server_default is not None:
                try:
                    default = str(col.server_default.arg)[:120]
                except Exception:
                    default = "(server_default)"
            elif col.default is not None:
                arg = getattr(col.default, "arg", None)
                if callable(arg):
                    default = "(callable)"
                else:
                    default = repr(arg)[:120] if arg is not None else ""
            lines.append(
                f"| `{col.name}` | `{_col_type(col)}` | "
                f"{'yes' if col.nullable else 'no'} | `{default}` |"
            )
        lines.append("")
        fks = list(table.foreign_keys)
        if fks:
            lines.append("**Foreign keys**")
            lines.append("")
            lines.append("| Column | References | On delete |")
            lines.append("| --- | --- | --- |")
            for fk in fks:
                rt = fk.column.table.name if fk.column is not None else "?"
                rc = fk.column.name if fk.column is not None else "?"
                ondel = fk.ondelete or ""
                lines.append(f"| `{fk.parent.name}` | `{rt}.{rc}` | {ondel or '—'} |")
            lines.append("")
        idxs = list(table.indexes)
        if idxs:
            lines.append("**Indexes**")
            lines.append("")
            for ix in idxs:
                cols = ", ".join(f"`{c.name}`" for c in ix.columns)
                uniq = "unique " if ix.unique else ""
                lines.append(f"- `{ix.name}` ({uniq}btree on {cols})")
            lines.append("")
        uqs = [c for c in table.constraints if c.__class__.__name__ == "UniqueConstraint"]
        if uqs:
            lines.append("**Unique constraints**")
            lines.append("")
            for uq in uqs:
                uq_name = uq.name or "(unnamed_unique)"
                col_names = [getattr(col, "name", str(col)) for col in uq.columns]
                cols = ", ".join(f"`{n}`" for n in col_names)
                lines.append(f"- `{uq_name}`: ({cols})")
            lines.append("")
        lines.append("---")
        lines.append("")
    lines.append("## Indexes added by migration `f8e9a0b1c2d3`")
    lines.append("")
    lines.append(
        "Concurrent btree indexes on foreign-key columns (see "
        "`Server/migrations/versions/f8e9a0b1c2d3_add_fk_supporting_indexes_concurrently.py`)."
    )
    lines.append("")
    lines.append("| Index | Table | Column(s) |")
    lines.append("| --- | --- | --- |")
    _rows = [
        ("ix_agreement_events_actor_id", "agreement_events", "actor_id"),
        ("ix_agreement_participants_user_id", "agreement_participants", "user_id"),
        ("ix_agreement_revisions_created_by", "agreement_revisions", "created_by"),
        ("ix_agreements_agent_id", "agreements", "agent_id"),
        ("ix_agreements_buyer_id", "agreements", "buyer_id"),
        ("ix_agent_connection_requests_agent_id", "agent_connection_requests", "agent_id"),
        ("ix_agent_connection_requests_client_id", "agent_connection_requests", "client_id"),
        ("ix_agent_conversations_agent_id", "agent_conversations", "agent_id"),
        ("ix_agent_conversations_client_id", "agent_conversations", "client_id"),
        ("ix_calendar_events_creator_id", "calendar_events", "creator_id"),
        ("ix_calendar_events_target_user_id", "calendar_events", "target_user_id"),
        ("ix_calendar_events_user_id", "calendar_events", "user_id"),
        ("ix_calendar_shares_calendar_owner_id", "calendar_shares", "calendar_owner_id"),
        ("ix_calendar_shares_shared_with_user_id", "calendar_shares", "shared_with_user_id"),
        ("ix_chat_history_conversation_id", "chat_history", "conversation_id"),
        ("ix_documents_user_id", "documents", "user_id"),
        ("ix_docusign_templates_created_by_user_id", "docusign_templates", "created_by_user_id"),
        ("ix_search_session_user_id", "search_session", "user_id"),
        ("ix_todos_agent_id", "todos", "agent_id"),
        ("ix_todos_client_id", "todos", "client_id"),
        ("ix_user_tasks_user_id", "user_tasks", "user_id"),
        ("ix_transactions_buyer_id", "transactions", "buyer_id"),
        ("ix_transactions_primary_agent_id", "transactions", "primary_agent_id"),
        ("ix_user_calendar_connections_user_id", "user_calendar_connections", "user_id"),
        ("ix_user_important_locations_user_id", "user_important_locations", "user_id"),
        ("ix_user_intent_attributes_user_id", "user_intent_attributes", "user_id"),
    ]
    for ix, tbl, col in _rows:
        lines.append(f"| `{ix}` | `{tbl}` | `{col}` |")
    lines.append("")
    return "\n".join(lines)


def _sanitize_mermaid_name(name: str) -> str:
    out = []
    for c in name:
        if c.isalnum():
            out.append(c)
        else:
            out.append("_")
    s = "".join(out)
    if s and s[0].isdigit():
        return f"t_{s}"
    return s or "entity"


def _emit_relationships_mermaid(tables: list) -> str:
    """ER diagram: one edge per (parent, child) with FK column labels."""
    edge_labels: dict[tuple[str, str], list[str]] = {}
    for table in tables:
        child = _sanitize_mermaid_name(table.name)
        for fk in table.foreign_keys:
            if fk.column is None:
                continue
            parent = _sanitize_mermaid_name(fk.column.table.name)
            edge_labels.setdefault((parent, child), []).append(fk.parent.name)
    lines = [
        "# PostgreSQL relationships",
        "",
        "Mermaid ER view derived from SQLAlchemy foreign keys. "
        "Cardinality is approximate (parent `||--o{` child).",
        "",
        "```mermaid",
        "erDiagram",
    ]
    nodes = set()
    for parent, child in edge_labels:
        nodes.add(parent)
        nodes.add(child)
    for n in sorted(nodes):
        lines.append(f"    {n} {{ string id }}")
    for parent, child in sorted(edge_labels):
        cols = ", ".join(sorted(set(edge_labels[(parent, child)])))
        safe = cols.replace('"', "'")[:80]
        lines.append(f'    {parent} ||--o{{ {child} : "{safe}"')
    lines.append("```")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    os.chdir(_SERVER)
    from app import create_app

    app = create_app()
    with app.app_context():
        from app import db

        tables = sorted(db.metadata.tables.values(), key=lambda t: t.name)
    _DOCS.mkdir(parents=True, exist_ok=True)
    (_DOCS / "schema.md").write_text(_emit_schema_md(tables), encoding="utf-8")
    (_DOCS / "relationships.md").write_text(_emit_relationships_mermaid(tables), encoding="utf-8")
    sys.stdout.write(f"Wrote {_DOCS / 'schema.md'} and {_DOCS / 'relationships.md'}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
