#!/usr/bin/env python3
"""
Standalone compile linter for Server Python files.
Attempts to compile each .py file; emits VS Code–parseable diagnostics on failure.
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


def server_root():
    """Server tree root (parent of scripts/)."""
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


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


def main() -> int:
    root = server_root()
    has_error = False
    for path in sorted(collect_py_files(root)):
        abs_path = os.path.abspath(path)
        try:
            with open(path, encoding="utf-8") as f:
                source = f.read()
        except UnicodeDecodeError:
            print(f"{abs_path}:1:1: error: File is not valid UTF-8.", flush=True)
            has_error = True
            continue
        try:
            compile(source, path, "exec")
        except SyntaxError as e:
            line = e.lineno if e.lineno is not None else 1
            offset = e.offset if e.offset is not None else 1
            msg = e.msg or "Syntax error"
            print(f"{abs_path}:{line}:{offset}: error: {msg}", flush=True)
            has_error = True
        except (ValueError, TypeError) as e:
            print(f"{abs_path}:1:1: error: {e}", flush=True)
            has_error = True
    return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
