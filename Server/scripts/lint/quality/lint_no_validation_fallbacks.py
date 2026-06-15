#!/usr/bin/env python3
"""Fail if route handlers still use gradual OpenAPI validation fallbacks."""

from __future__ import annotations

import re
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
_ROUTES = _REPO_ROOT / "app" / "routes"

# Service-return checks, not OpenAPI gradual fallbacks
_ALLOWED = {
    ("tasks.py", "if data is None:"),
    ("transactions/__init__.py", "if data is None:"),
}

_DATA_FALLBACK = re.compile(r"if\s+data\s+is\s+None\s*:")
_QUERY_FALLBACK = re.compile(r"if\s+query\s+is\s+None\s*:")
_GET_JSON = re.compile(r"request\.get_json")


def main() -> int:
    violations: list[str] = []

    for path in sorted(_ROUTES.rglob("*.py")):
        rel = path.relative_to(_ROUTES)
        rel_s = str(rel)
        text = path.read_text()
        for i, line in enumerate(text.splitlines(), start=1):
            stripped = line.strip()
            if (_DATA_FALLBACK.search(line) or _QUERY_FALLBACK.search(line)) and (
                rel_s,
                stripped,
            ) not in _ALLOWED:
                violations.append(f"{rel}:{i}: {stripped}")
            if _GET_JSON.search(line) and "request.get_data" not in line:
                violations.append(f"{rel}:{i}: {stripped}")

    if violations:
        print("OpenAPI validation fallback patterns found under Server/app/routes:")
        for v in violations:
            print(f"  - {v}")
        return 1

    print("No OpenAPI validation fallback patterns under Server/app/routes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
