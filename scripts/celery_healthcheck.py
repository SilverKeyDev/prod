#!/usr/bin/env python3
"""
Verify connectivity to the Celery broker URL (same as the Flask app).

Uses Kombu (bundled with Celery) to open a short-lived connection — no
separate `redis-cli` required.

Exit codes:
  0 — broker accepted a connection
  1 — failure (misconfiguration, network, broker unavailable)

Run from the repository root with Server dependencies on PYTHONPATH, e.g.:

    cd Server && . .venv/bin/activate && python ../scripts/celery_healthcheck.py

Or set PYTHONPATH to `Server/` and install `Server/requirements/runtime.txt`.
"""

from __future__ import annotations

import os
import sys


def _server_root() -> str:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(repo_root, "Server")


def main() -> int:
    server_root = _server_root()
    if not os.path.isdir(server_root):
        sys.stderr.write(f"error: Server directory not found at {server_root}\n")
        return 1

    if server_root not in sys.path:
        sys.path.insert(0, server_root)

    try:
        from dotenv import load_dotenv
    except ImportError:
        load_dotenv = None

    env_path = os.path.join(server_root, ".env")
    if load_dotenv is not None and os.path.isfile(env_path):
        load_dotenv(env_path)

    try:
        from kombu import Connection

        from app.config import Config
    except ImportError as exc:
        sys.stderr.write(
            f"error: failed to import dependencies: {exc}\n"
            "hint: activate the Server virtualenv or install Server/requirements/runtime.txt\n"
        )
        return 1

    url = Config.CELERY_URL
    if not url:
        sys.stderr.write("error: CELERY_URL resolved to empty\n")
        return 1

    conn = Connection(url, connect_timeout=3.0)
    try:
        conn.ensure_connection(max_retries=1)
    except Exception as exc:
        sys.stderr.write(f"error: broker connection failed for {url!r}: {exc}\n")
        return 1
    finally:
        try:
            conn.release()
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
