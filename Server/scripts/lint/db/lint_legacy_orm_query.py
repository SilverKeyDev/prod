#!/usr/bin/env python3
"""
Fail CI if legacy SQLAlchemy ORM query APIs remain in production or test code.

Forbidden patterns (SQLAlchemy 1.x / Flask-SQLAlchemy legacy):
  - Model dot query attribute chains
  - legacy session-level query(...) calls

Allowed: db.session.get / scalar / scalars / execute with select(), delete(), update().
"""

from __future__ import annotations

import os
import re
import sys

_path = os.path.abspath(__file__)
for _ in range(4):
    _path = os.path.dirname(_path)
SERVER_ROOT = _path

SCAN_ROOTS = (
    os.path.join(SERVER_ROOT, "app"),
    os.path.join(SERVER_ROOT, "tests"),
    os.path.join(SERVER_ROOT, "scripts"),
)

EXCLUDED_DIRS = frozenset(
    {
        ".venv",
        ".venv-ci",
        "venv",
        "__pycache__",
        ".git",
        "migrations",
        "alembic",
    }
)

_LEGACY_QUERY_ATTR = re.compile(r"\." + "query" + r"\.")
_LEGACY_MODEL_QUERY = re.compile(r"\b[A-Z]\w+\." + "query" + r"\b")
_LEGACY_SESSION_QUERY = re.compile(r"db\.session\." + "query" + r"\(")
_LEGACY_BARE_SESSION_QUERY = re.compile(r"(?<!\w)session\." + "query" + r"\(")

LEGACY_PATTERNS = (
    (_LEGACY_QUERY_ATTR, "Model.query chain (legacy ORM query API)"),
    (_LEGACY_MODEL_QUERY, "Model.query attribute (legacy ORM query API)"),
    (_LEGACY_SESSION_QUERY, "db.session.query (legacy session query API)"),
    (_LEGACY_BARE_SESSION_QUERY, "session.query (legacy session query API)"),
)


def _is_duplicate_editor_copy(filename: str) -> bool:
    """Skip macOS duplicate copies (e.g. 'module 2.py') ignored by .gitignore."""
    import re

    return bool(re.search(r" \d+\.py$", filename))


def _iter_python_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        for name in filenames:
            if name.endswith(".py") and not _is_duplicate_editor_copy(name):
                yield os.path.join(dirpath, name)


def main() -> int:
    violations: list[str] = []
    for root in SCAN_ROOTS:
        if not os.path.isdir(root):
            continue
        for path in _iter_python_files(root):
            if os.path.basename(path) == "lint_legacy_orm_query.py":
                continue
            rel = os.path.relpath(path, SERVER_ROOT)
            with open(path, encoding="utf-8") as fh:
                for line_no, line in enumerate(fh, start=1):
                    for pattern, label in LEGACY_PATTERNS:
                        if pattern.search(line):
                            violations.append(f"{rel}:{line_no}: {label}\n  {line.rstrip()}")

    if violations:
        print(
            "Legacy SQLAlchemy query API usage found "
            f"({len(violations)} line(s)). Use select() + db.session.scalar/scalars/execute.\n",
            file=sys.stderr,
        )
        for v in violations[:50]:
            print(v, file=sys.stderr)
        if len(violations) > 50:
            print(f"... and {len(violations) - 50} more", file=sys.stderr)
        return 1

    print("No legacy ORM query patterns found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
