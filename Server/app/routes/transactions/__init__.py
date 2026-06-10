"""Transaction-related API (tasks, address, checklist items)."""

from flask import Blueprint

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/v1/transactions")

from .handlers import (  # noqa: E402, F401 — register routes on import
    address,
    checklist,
    checklist_item_rules,
    crud,
)

__all__ = ["transactions_bp"]
