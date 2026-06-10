#!/usr/bin/env python3
"""CI gate: all mutating route handlers must use OpenAPI request validation decorators."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[4]
_SCRIPT = _REPO_ROOT / "Server" / "scripts" / "validate-schema-coverage.py"


def main() -> int:
    result = subprocess.run(
        [sys.executable, str(_SCRIPT), "--strict"],
        cwd=_REPO_ROOT,
        check=False,
    )
    return int(result.returncode)


if __name__ == "__main__":
    raise SystemExit(main())
