#!/usr/bin/env python3
"""Minimal DB connectivity check: SELECT 1.

Exit 0 on success, 1 on failure. Uses DATABASE_URL (same as the Flask app).

Example:
  cd Server && python scripts/db_healthcheck.py
"""

from __future__ import annotations

import os
import sys


def main() -> int:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        sys.stderr.write("db_healthcheck: DATABASE_URL is not set\n")
        return 1

    try:
        from sqlalchemy import create_engine, text
    except ImportError as exc:
        sys.stderr.write(f"db_healthcheck: SQLAlchemy required: {exc}\n")
        return 1

    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        sys.stderr.write(f"db_healthcheck: connection failed: {exc}\n")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
