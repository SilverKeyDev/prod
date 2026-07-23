"""Errors for brokerage DB query / MCP guardrails (SIL-323)."""

from __future__ import annotations


class BrokerageDbQueryError(Exception):
    """Base error for brokerage DB query service."""


class QueryGuardrailError(BrokerageDbQueryError):
    """SQL rejected as unsafe for the read-only NL / query path."""

    def __init__(self, message: str, *, code: str = "query_rejected") -> None:
        super().__init__(message)
        self.code = code


class ConnectionConfigError(BrokerageDbQueryError):
    """Brokerage DB connection config missing or invalid."""

    def __init__(self, message: str, *, code: str = "connection_config") -> None:
        super().__init__(message)
        self.code = code


class QueryExecutionError(BrokerageDbQueryError):
    """Read-only query failed validation or execution."""

    def __init__(self, message: str, *, code: str = "query_execution") -> None:
        super().__init__(message)
        self.code = code


class NlQueryError(BrokerageDbQueryError):
    """Natural-language query planning failed."""

    def __init__(self, message: str, *, code: str = "nl_query") -> None:
        super().__init__(message)
        self.code = code
