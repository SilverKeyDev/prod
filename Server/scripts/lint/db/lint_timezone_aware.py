#!/usr/bin/env python3
"""
Linter to detect timezone-naive datetime usage.

Detects and optionally fixes timezone-naive datetime.now() patterns,
converting them to timezone-aware alternatives.

Usage:
    python scripts/lint/lint_timezone_aware.py         # Check only
    python scripts/lint/lint_timezone_aware.py --fix   # Auto-fix
"""

import argparse
import os
import re
import sys

# Excluded directory names (any path segment matching is skipped)
EXCLUDED_DIRS = frozenset(
    {
        ".venv",
        ".venv-ci",
        "venv",
        "__pycache__",
        ".git",
        "node_modules",
        "migrations",
        "alembic",
        "dist",
        "build",
        ".pytest_cache",
    }
)


def server_root():
    """Server tree root (parent of scripts/)."""
    path = os.path.abspath(__file__)
    for _ in range(4):
        path = os.path.dirname(path)
    return path


def should_skip_dir(dirpath: str) -> bool:
    """True if any path segment is in EXCLUDED_DIRS."""
    parts = os.path.normpath(dirpath).split(os.sep)
    return any(p in EXCLUDED_DIRS for p in parts)


def collect_py_files(root: str):
    """Yield absolute paths of .py files under root, respecting exclusions."""
    for dirpath, dirnames, filenames in os.walk(root):
        if should_skip_dir(dirpath):
            dirnames.clear()
            continue
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        for name in filenames:
            if name.endswith(".py"):
                yield os.path.join(dirpath, name)


def check_file(path: str) -> list[tuple[int, int, str, str]]:
    """
    Check a file for timezone-naive datetime usage.

    Returns list of (line_num, col, pattern, suggested_fix) tuples.
    """
    violations = []

    try:
        with open(path, encoding="utf-8") as f:
            lines = f.readlines()
    except (OSError, UnicodeDecodeError):
        return violations

    # Pattern 1: datetime.now(timezone.utc) - function call
    utcnow_call_pattern = re.compile(r"\bdatetime\.utcnow\(\)")

    # Pattern 2: datetime.utcnow without () - reference (e.g., in default=)
    # But NOT if it's followed by + or - (those are usually offset calculations)
    utcnow_ref_pattern = re.compile(r"\bdatetime\.utcnow(?!\(\)|[\+\-])")

    for line_num, line in enumerate(lines, start=1):
        # Skip comments
        code_part = line.split("#")[0]

        # Check for datetime.now(timezone.utc) calls
        for match in utcnow_call_pattern.finditer(code_part):
            violations.append(
                (
                    line_num,
                    match.start() + 1,
                    "datetime.now(timezone.utc)",
                    "datetime.now(timezone.utc)",
                )
            )

        # Check for datetime.utcnow references (without call)
        for match in utcnow_ref_pattern.finditer(code_part):
            violations.append(
                (
                    line_num,
                    match.start() + 1,
                    "naive datetime reference",
                    "lambda: datetime.now(timezone.utc)",
                )
            )

    return violations


def fix_file(path: str, violations: list[tuple[int, int, str, str]]) -> bool:
    """
    Fix timezone-naive datetime usage in a file.

    Returns True if file was modified.
    """
    if not violations:
        return False

    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except (OSError, UnicodeDecodeError):
        return False

    original_content = content

    # Replace datetime.now(timezone.utc) -> datetime.now(timezone.utc)
    content = re.sub(r"\bdatetime\.utcnow\(\)", "datetime.now(timezone.utc)", content)

    # Replace datetime.utcnow -> lambda: datetime.now(timezone.utc)
    # But be careful with context - only in mapped_column defaults
    # Pattern: default=lambda: datetime.now(timezone.utc) or onupdate=lambda: datetime.now(timezone.utc)
    content = re.sub(
        r"((?:default|onupdate)\s*=\s*)datetime\.utcnow(?!\(\))",
        r"\1lambda: datetime.now(timezone.utc)",
        content,
    )

    if content == original_content:
        return False

    # Ensure timezone import exists
    if "from datetime import" in content and "timezone" not in content:
        # Add timezone to existing datetime import
        content = re.sub(
            r"from datetime import (datetime(?:, \w+)*)",
            lambda m: (
                f"from datetime import {m.group(1)}, timezone"
                if "timezone" not in m.group(1)
                else m.group(0)
            ),
            content,
            count=1,
        )

    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    except OSError:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Detect timezone-naive datetime usage")
    parser.add_argument("--fix", action="store_true", help="Automatically fix violations")
    args = parser.parse_args()

    root = server_root()
    has_error = False
    fixed_count = 0
    total_violations = 0

    for path in sorted(collect_py_files(root)):
        abs_path = os.path.abspath(path)
        violations = check_file(path)

        if violations:
            total_violations += len(violations)

            if args.fix:
                if fix_file(path, violations):
                    fixed_count += 1
                    print(f"Fixed {len(violations)} violation(s) in {abs_path}", flush=True)
            else:
                has_error = True
                for line_num, col, pattern, fix in violations:
                    print(
                        f"{abs_path}:{line_num}:{col}: error: "
                        f"Timezone-naive datetime usage: {pattern} "
                        f"(use {fix})",
                        flush=True,
                    )

    if args.fix:
        if fixed_count > 0:
            print(f"\n✓ Fixed {total_violations} violation(s) in {fixed_count} file(s)", flush=True)
        else:
            print("✓ No violations found", flush=True)
        return 0
    else:
        if has_error:
            print(f"\n✗ Found {total_violations} timezone-naive datetime violation(s)", flush=True)
            print("Run with --fix to automatically fix them", flush=True)
        else:
            print("✓ No violations found", flush=True)
        return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
