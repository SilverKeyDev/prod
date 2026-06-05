"""Verify env-driven SQLAlchemy pool sizing for PostgreSQL (scale-readiness)."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[4]


def _run_pool_config_snippet(
    extra_env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(SERVER_DIR)
    env["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/silverkey_test"
    env["SECRET_KEY"] = "test-pool-config-secret"
    env["TESTING"] = "false"
    env.pop("DB_POOL_SIZE", None)
    env.pop("DB_MAX_OVERFLOW", None)
    if extra_env:
        env.update(extra_env)

    code = """
from app.config import database
opts = database.SQLALCHEMY_ENGINE_OPTIONS
print(opts["pool_size"], opts["max_overflow"])
"""
    return subprocess.run(
        [sys.executable, "-c", code],
        cwd=str(SERVER_DIR),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def test_postgres_pool_defaults():
    result = _run_pool_config_snippet()
    assert result.returncode == 0, result.stderr
    pool_size, max_overflow = result.stdout.strip().split()
    assert int(pool_size) == 5
    assert int(max_overflow) == 10


def test_postgres_pool_respects_env_overrides():
    result = _run_pool_config_snippet({"DB_POOL_SIZE": "3", "DB_MAX_OVERFLOW": "7"})
    assert result.returncode == 0, result.stderr
    pool_size, max_overflow = result.stdout.strip().split()
    assert int(pool_size) == 3
    assert int(max_overflow) == 7
