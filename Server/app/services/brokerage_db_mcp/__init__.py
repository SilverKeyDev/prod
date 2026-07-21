"""Brokerage DB query service (SIL-323)."""

from app.services.brokerage_db_mcp.connection import (
    MIRROR_ALLOWED_TABLES,
    MODE_SILVERKEY_MIRROR,
    BrokerageDbConfig,
    resolve_connection_config,
)
from app.services.brokerage_db_mcp.errors import (
    BrokerageDbQueryError,
    ConnectionConfigError,
    QueryGuardrailError,
)
from app.services.brokerage_db_mcp.guardrails import DEFAULT_MAX_LIMIT, validate_read_only_sql
from app.services.brokerage_db_mcp.introspection import (
    ColumnInfo,
    SchemaSnapshot,
    TableInfo,
    introspect_schema,
)

__all__ = [
    "BrokerageDbConfig",
    "BrokerageDbQueryError",
    "ColumnInfo",
    "ConnectionConfigError",
    "DEFAULT_MAX_LIMIT",
    "MODE_SILVERKEY_MIRROR",
    "MIRROR_ALLOWED_TABLES",
    "QueryGuardrailError",
    "SchemaSnapshot",
    "TableInfo",
    "introspect_schema",
    "resolve_connection_config",
    "validate_read_only_sql",
]
