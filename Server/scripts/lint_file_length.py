#!/usr/bin/env python3
"""
Standalone file-length linter for Server Python files.
Warns at >400 lines, errors at >500. Emits VS Code–parseable diagnostics.
No Flask or app imports; stdlib only.
"""

import os
import sys

# Excluded directory names (any path segment matching is skipped)
EXCLUDED_DIRS = frozenset(
    {
        ".venv",
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

WARN_THRESHOLD = 400
ERROR_THRESHOLD = 500


def server_root():
    """Server tree root (parent of scripts/)."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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
        # Prune excluded dirs from descent
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        for name in filenames:
            if name.endswith(".py"):
                yield os.path.join(dirpath, name)


def main() -> int:
    root = server_root()
    has_error = False
    for path in sorted(collect_py_files(root)):
        try:
            with open(path, encoding="utf-8") as f:
                lines = f.readlines()
        except UnicodeDecodeError:
            abs_path = os.path.abspath(path)
            print(f"{abs_path}:1:1: error: File is not valid UTF-8.", flush=True)
            has_error = True
            continue
        n = len(lines)
        abs_path = os.path.abspath(path)
        if n > ERROR_THRESHOLD:
            print(
                f"{abs_path}:1:1: error: File has {n} lines (max {ERROR_THRESHOLD}).",
                flush=True,
            )
            has_error = True
        elif n > WARN_THRESHOLD:
            print(
                f"{abs_path}:1:1: warning: File has {n} lines (max {WARN_THRESHOLD} recommended).",
                flush=True,
            )
    return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
