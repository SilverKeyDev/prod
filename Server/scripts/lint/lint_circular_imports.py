#!/usr/bin/env python3
"""
Lint script: fail if the app has circular imports.
Runs the same import chain as run.py (from app import create_app) and catches
ImportError mentioning "circular" or "partially initialized".
Does not call create_app() so no database or network is required.
Run from repo root: python3 Server/scripts/lint/lint_circular_imports.py
Requires Server dependencies installed (pip install -r Server/requirements-ci.txt in CI,
or full pip install -r Server/requirements.txt for a local runtime that matches production).
"""

import os
import sys


def _server_root() -> str:
    """Server tree root (parent of scripts/)."""
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main() -> int:
    server_root = _server_root()
    if server_root not in sys.path:
        sys.path.insert(0, server_root)

    # Allow import chain to load without a real DB or AWS (we never call create_app()).
    if not os.environ.get("DATABASE_URL"):
        os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    if not os.environ.get("AWS_SECRET_ACCESS_KEY"):
        os.environ["AWS_SECRET_ACCESS_KEY"] = "placeholder"

    try:
        from app import create_app  # noqa: F401

        return 0
    except ImportError as e:
        msg = str(e).lower()
        if "circular" in msg or "partially initialized" in msg:
            print("Circular import detected:", file=sys.stderr)
            import traceback

            traceback.print_exc()
            return 1
        raise


if __name__ == "__main__":
    sys.exit(main())
