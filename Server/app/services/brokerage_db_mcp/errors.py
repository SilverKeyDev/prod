"""Errors for brokerage DB query / MCP guardrails (SIL-323)."""

from __future__ import annotations


class BrokerageDbQueryError(Exception):
    """Base error for brokerage DB query service."""


class QueryGuardrailError(BrokerageDbQueryError):
    """SQL rejected as unsafe for the read-only NL / query path."""

    def __init__(self, message: str, *, code: str = "query_rejected") -> None:
        super().__init__(message)
        self.code = code
