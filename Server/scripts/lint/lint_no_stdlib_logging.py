#!/usr/bin/env python3
"""
Ban legacy product logging in Server/app: stdlib logging, app_logging, current_app.logger.

Infrastructure stdlib tuning belongs under Server/logger/ only.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP_ROOT = ROOT / "app"

SKIP_DIR_NAMES = frozenset(
    {
        "__pycache__",
        ".pytest_cache",
        "node_modules",
    }
)

# app/__init__.py may use logging before Flask for multiprocessing guard only.
APP_INIT_SPAWN_GUARD_MAX_LINE = 25

ALLOWLIST_RELATIVE = frozenset(
    {
        "migrations/env.py",
    }
)

BANNED_IMPORT_PATTERNS = (
    re.compile(r"^\s*import\s+logging\b"),
    re.compile(r"^\s*from\s+logging\s+import\b"),
    re.compile(r"from\s+app\.utils\.security\.app_logging\s+import"),
    re.compile(r"from\s+\.\.utils\.security\.app_logging\s+import"),
    re.compile(r"from\s+\.\.\.utils\.security\.app_logging\s+import"),
)

BANNED_USAGE_PATTERNS = (
    re.compile(r"\blogging\.getLogger\s*\("),
    re.compile(r"\bcurrent_app\.logger\b"),
)


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def should_scan(path: Path) -> bool:
    if path.suffix != ".py":
        return False
    rel_path = rel(path)
    if rel_path in ALLOWLIST_RELATIVE:
        return False
    if "/tests/" in rel_path or rel_path.endswith("/tests"):
        return False
    parts = path.parts
    if any(p in SKIP_DIR_NAMES for p in parts):
        return False
    return True


def scan_file(path: Path) -> list[str]:
    violations: list[str] = []
    text = path.read_text(encoding="utf-8")
    rel_path = rel(path)
    is_app_init = rel_path == "app/__init__.py"

    for line_no, line in enumerate(text.splitlines(), start=1):
        if is_app_init and line_no <= APP_INIT_SPAWN_GUARD_MAX_LINE:
            if "import logging" in line or "logging.getLogger" in line:
                continue

        for pattern in BANNED_IMPORT_PATTERNS:
            if pattern.search(line):
                violations.append(
                    f"{rel_path}:{line_no}:1: error: legacy logging import; use `from logger import log`"
                )
                break

        for pattern in BANNED_USAGE_PATTERNS:
            if pattern.search(line):
                violations.append(
                    f"{rel_path}:{line_no}:1: error: legacy logging usage; use SilverKey `log` with LogPath"
                )
                break

    return violations


def main() -> int:
    if not APP_ROOT.is_dir():
        print(f"app root not found: {APP_ROOT}", file=sys.stderr)
        return 1

    all_violations: list[str] = []
    for path in sorted(APP_ROOT.rglob("*.py")):
        if not should_scan(path):
            continue
        all_violations.extend(scan_file(path))

    if all_violations:
        print("Legacy logging violations in Server/app:")
        for item in all_violations:
            print(f"  {item}")
        print(f"\n{len(all_violations)} violation(s).")
        return 1

    print("lint_no_stdlib_logging: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
