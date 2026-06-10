"""SQLAlchemy 2.0–friendly ORM lookups (replaces legacy session query primary-key get)."""

from __future__ import annotations

from typing import TypeVar

from app import db

T = TypeVar("T")


def get_model(model: type[T], primary_key) -> T | None:
    """Load a row by primary key via the current session."""
    return db.session.get(model, primary_key)
