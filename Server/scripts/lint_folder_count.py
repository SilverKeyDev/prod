#!/usr/bin/env python3
"""
Standalone folder subitem-count linter for Server directories.
Warns at 14+ direct children, errors at 16+. Emits VS Code–parseable diagnostics.
No Flask or app imports; stdlib only.
"""

import os
import sys

# Excluded directory names (same as lint_file_length; not descended into, not counted as siblings)
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
        ".cursor",
    }
)

WARN_THRESHOLD = 14
ERROR_THRESHOLD = 16
# Large flat roots: full decomposition is tracked separately; avoid blocking CI on count alone.
RELAXED_REL_PATHS = frozenset({"app/routes", "app/models/user", "tests/unit"})
RELAXED_ERROR_THRESHOLD = 48


def server_root():
    """Server tree root (parent of scripts/)."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def should_skip_dir(dirpath: str) -> bool:
    """True if any path segment is in EXCLUDED_DIRS."""
    parts = os.path.normpath(dirpath).split(os.sep)
    return any(p in EXCLUDED_DIRS for p in parts)


def _rel_posix(dirpath: str, root: str) -> str:
    return os.path.relpath(dirpath, root).replace(os.sep, "/")


def count_direct_children(dirpath: str) -> int:
    """Count direct children (files + dirs) in dirpath, excluding EXCLUDED_DIRS names."""
    try:
        names = os.listdir(dirpath)
    except OSError:
        return 0
    return sum(1 for n in names if n not in EXCLUDED_DIRS)


def collect_dirs_with_py(root: str):
    """Yield (dirpath, list of .py file paths in that dir) for each directory under root."""
    for dirpath, dirnames, filenames in os.walk(root):
        if should_skip_dir(dirpath):
            dirnames.clear()
            continue
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        py_files = [os.path.join(dirpath, f) for f in filenames if f.endswith(".py")]
        if py_files:
            yield dirpath, py_files


def main() -> int:
    root = server_root()
    has_error = False
    for dirpath, py_files in sorted(collect_dirs_with_py(root)):
        # Exception: do not report on Server root (monorepo root has many direct children)
        if dirpath == root:
            continue
        count = count_direct_children(dirpath)
        rel_posix = _rel_posix(dirpath, root)
        error_cap = RELAXED_ERROR_THRESHOLD if rel_posix in RELAXED_REL_PATHS else ERROR_THRESHOLD
        warn_cap = WARN_THRESHOLD
        if count < warn_cap:
            continue
        is_error = count >= error_cap
        if is_error:
            has_error = True
        max_ok = error_cap - 1 if is_error else warn_cap - 1
        level = "error" if is_error else "warning"
        msg = (
            f"Folder has {count} direct children (max {max_ok})."
            if is_error
            else f"Folder has {count} direct children (recommended max {max_ok})."
        )
        # Report on first .py file in this dir so IDE can open it
        rep_path = sorted(py_files)[0]
        abs_path = os.path.abspath(rep_path)
        print(f"{abs_path}:1:1: {level}: {msg}", flush=True)
    return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
