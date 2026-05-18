"""Detect CI/production Alembic runs that must not require full app secrets."""

import os


def is_migrate_only() -> bool:
    """True when only ``flask db upgrade`` (or Alembic) should run — not the API server."""
    return os.getenv("SILVERKEY_MIGRATE_ONLY", "").strip().lower() in ("1", "true", "yes")
