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
    NlQueryError,
    QueryExecutionError,
    QueryGuardrailError,
)
from app.services.brokerage_db_mcp.executor import QueryResult, execute_readonly
from app.services.brokerage_db_mcp.guardrails import DEFAULT_MAX_LIMIT, validate_read_only_sql
from app.services.brokerage_db_mcp.introspection import (
    ColumnInfo,
    SchemaSnapshot,
    TableInfo,
    introspect_schema,
)
from app.services.brokerage_db_mcp.nl_query import (
    NlQueryResult,
    build_nl_user_prompt,
    generate_sql_with_openai,
    run_nl_query,
)

__all__ = [
    "BrokerageDbConfig",
    "BrokerageDbQueryError",
    "ColumnInfo",
    "ConnectionConfigError",
    "DEFAULT_MAX_LIMIT",
    "MODE_SILVERKEY_MIRROR",
    "MIRROR_ALLOWED_TABLES",
    "NlQueryError",
    "NlQueryResult",
    "QueryExecutionError",
    "QueryGuardrailError",
    "QueryResult",
    "SchemaSnapshot",
    "TableInfo",
    "build_nl_user_prompt",
    "execute_readonly",
    "generate_sql_with_openai",
    "introspect_schema",
    "resolve_connection_config",
    "run_nl_query",
    "validate_read_only_sql",
]
