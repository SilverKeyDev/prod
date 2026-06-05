#!/usr/bin/env python3
"""Fail CI when route handlers leak exception text or use raw 500 jsonify errors."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROUTES_ROOT = Path(__file__).resolve().parents[3] / "app" / "routes"

# Client JSON must not embed exception strings.
STR_IN_RESPONSE = re.compile(
    r'return\s+jsonify\s*\([^)]*["\']error["\']\s*:\s*str\s*\(',
    re.MULTILINE | re.DOTALL,
)

# Prefer SecureErrorHandler / http_errors helpers for 500 responses.
RAW_500_JSONIFY = re.compile(
    r"return\s+jsonify\s*\([^)]+\)\s*,\s*500\b",
    re.MULTILINE | re.DOTALL,
)

ALLOWED_500_MARKERS = (
    "SecureErrorHandler",
    "server_error(",
    "handle_database_error",
    "handle_error(",
    "configuration_unavailable",
    "external_unavailable",
)


def _line_has_allowed_500_marker(lines: list[str], line_index: int) -> bool:
    window = "\n".join(lines[max(0, line_index - 8) : line_index + 1])
    return any(marker in window for marker in ALLOWED_500_MARKERS)


def main() -> int:
    violations: list[str] = []

    for path in sorted(ROUTES_ROOT.rglob("*.py")):
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROUTES_ROOT.parent.parent)

        for match in STR_IN_RESPONSE.finditer(text):
            line = text[: match.start()].count("\n") + 1
            violations.append(f"{rel}:{line}: str(e) in jsonify error response")

        lines = text.splitlines()
        for match in RAW_500_JSONIFY.finditer(text):
            line = text[: match.start()].count("\n") + 1
            if not _line_has_allowed_500_marker(lines, line - 1):
                violations.append(
                    f"{rel}:{line}: raw jsonify 500 (use server_error / SecureErrorHandler)"
                )

    if violations:
        print("Route error response lint failed:\n", file=sys.stderr)
        for v in violations:
            print(f"  - {v}", file=sys.stderr)
        return 1

    print("Route error response lint passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
