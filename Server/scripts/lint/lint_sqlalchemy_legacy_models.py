#!/usr/bin/env python3
"""Fail if Server/app/models reintroduces SQLAlchemy 1.x column or backref patterns."""

from __future__ import annotations

import re
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
_MODELS = _REPO_ROOT / "app" / "models"

_DB_COLUMN = re.compile(r"\bdb\.Column\b")
_BACKREF = re.compile(r"\bbackref\s*=")


def _line_without_comment(line: str) -> str:
    return line.split("#", 1)[0]


def main() -> int:
    violations: list[str] = []

    if not _MODELS.is_dir():
        print(f"Models directory not found: {_MODELS}", file=sys.stderr)
        return 1

    for path in sorted(_MODELS.rglob("*.py")):
        rel = path.relative_to(_REPO_ROOT)
        for line_no, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            line = _line_without_comment(raw)
            if _DB_COLUMN.search(line):
                violations.append(f"{rel}:{line_no}: db.Column (use Mapped + mapped_column)")
            if _BACKREF.search(line):
                violations.append(f"{rel}:{line_no}: backref= (use back_populates)")

    if violations:
        print("Legacy SQLAlchemy patterns in Server/app/models:")
        for v in violations:
            print(f"  - {v}")
        return 1

    print("No db.Column or backref= in Server/app/models")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
