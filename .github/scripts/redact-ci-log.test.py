#!/usr/bin/env python3
"""Lightweight checks for redact-ci-log (run: python3 .github/scripts/redact-ci-log.test.py)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).with_name("redact-ci-log.py")


def run(args: list[str], stdin: str) -> str:
    proc = subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        input=stdin,
        text=True,
        capture_output=True,
        check=True,
    )
    return proc.stdout


def test_redact_connection_string() -> None:
    out = run([], "DATABASE_URL=postgresql://user:pass@host/db\n")
    assert "[REDACTED" in out
    assert "pass" not in out


def test_highlights_keep_traceback() -> None:
    sample = "\n".join(
        [
            "INFO: boot ok",
            "ERROR: db down",
            "Traceback (most recent call last):",
            "  File \"/app/foo.py\", line 1",
            "OperationalError: connection refused",
        ]
    )
    out = run(["--highlights"], sample)
    assert "ERROR: db down" in out
    assert "Traceback" in out
    assert "OperationalError" in out
    assert "INFO: boot ok" not in out


def main() -> int:
    test_redact_connection_string()
    test_highlights_keep_traceback()
    print("redact-ci-log tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
