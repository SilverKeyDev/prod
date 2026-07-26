"""Schema introspection for brokerage DB query service (SIL-323)."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import inspect

from app import db
from app.services.brokerage_db_mcp.connection import BrokerageDbConfig
from app.services.brokerage_db_mcp.errors import ConnectionConfigError


@dataclass(frozen=True)
class ColumnInfo:
    name: str
    type_name: str
    nullable: bool


@dataclass(frozen=True)
class TableInfo:
    name: str
    columns: tuple[ColumnInfo, ...]


@dataclass(frozen=True)
class SchemaSnapshot:
    brokerage_org_id: str
    mode: str
    tables: tuple[TableInfo, ...]

    def prompt_text(self) -> str:
        """Compact schema text for a future NL→SQL prompt (Phase 5)."""
        lines: list[str] = [
            f"mode={self.mode}",
            f"brokerage_org_id={self.brokerage_org_id}",
            "tables:",
        ]
        for table in self.tables:
            cols = ", ".join(
                f"{c.name}:{c.type_name}{'?' if c.nullable else ''}" for c in table.columns
            )
            lines.append(f"  - {table.name}({cols})")
        return "\n".join(lines)


def introspect_schema(config: BrokerageDbConfig) -> SchemaSnapshot:
    """Introspect allowlisted tables only — no hardcoded product column list."""
    if config.mode != "silverkey_mirror":
        raise ConnectionConfigError(
            "Unsupported connection mode",
            code="unsupported_mode",
        )
    inspector = inspect(db.engine)
    existing = set(inspector.get_table_names())
    tables: list[TableInfo] = []
    for table_name in sorted(config.allowed_tables):
        if table_name not in existing:
            # Fail closed: allowlisted table missing from this DB
            raise ConnectionConfigError(
                f"Allowlisted table is not available: {table_name}",
                code="table_missing",
            )
        col_infos = tuple(
            ColumnInfo(
                name=col["name"],
                type_name=str(col["type"]),
                nullable=bool(col.get("nullable", True)),
            )
            for col in inspector.get_columns(table_name)
        )
        tables.append(TableInfo(name=table_name, columns=col_infos))
    return SchemaSnapshot(
        brokerage_org_id=config.brokerage_org_id,
        mode=config.mode,
        tables=tuple(tables),
    )
