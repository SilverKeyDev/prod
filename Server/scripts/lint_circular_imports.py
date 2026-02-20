#!/usr/bin/env python3
"""
Lint script: fail if the app has circular imports.
Runs the same import chain as run.py (from app import create_app) and catches
ImportError mentioning "circular" or "partially initialized".
Does not call create_app() so no database or network is required.
Run from repo root: python3 Server/scripts/lint_circular_imports.py
Requires Server dependencies installed (pip install -r Server/requirements.txt).
"""

import os
import sys


def _server_root() -> str:
    """Server tree root (parent of scripts/)."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main() -> int:
    server_root = _server_root()
    if server_root not in sys.path:
        sys.path.insert(0, server_root)

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
