#!/usr/bin/env python3
"""
Ban module-level raises when integration env vars are missing in app/.

Integration API keys must be validated at call time, not import time, so pytest/CI
can boot create_app() without a developer .env.

Usage:
    python scripts/lint/lint_import_time_env.py
"""

from __future__ import annotations

import ast
import os
import sys

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
        "tests",
    }
)

# Paths relative to Server/ that may raise at import for required infra config.
ALLOWLIST_SUFFIXES = (
    "app/config/database.py",
    "app/utils/validation/config_validator.py",
    "app/utils/security/env_validator.py",
)


def server_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def should_skip_dir(dirpath: str) -> bool:
    parts = os.path.normpath(dirpath).split(os.sep)
    return any(p in EXCLUDED_DIRS for p in parts)


def collect_py_files(root: str):
    app_root = os.path.join(root, "app")
    for dirpath, dirnames, filenames in os.walk(app_root):
        if should_skip_dir(dirpath):
            dirnames.clear()
            continue
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        for name in filenames:
            if name.endswith(".py"):
                yield os.path.join(dirpath, name)


def _is_env_guard_test(node: ast.expr) -> bool:
    """True for `if not VAR` where VAR looks like an env/config constant."""
    if not isinstance(node, ast.UnaryOp) or not isinstance(node.op, ast.Not):
        return False
    operand = node.operand
    if isinstance(operand, ast.Name):
        return operand.id.isupper() or "API_KEY" in operand.id or "SECRET" in operand.id
    if isinstance(operand, ast.Call):
        func = operand.func
        if isinstance(func, ast.Attribute) and func.attr == "getenv":
            return True
        if isinstance(func, ast.Name) and func.id == "getenv":
            return True
    return False


def _body_raises(node: ast.If) -> bool:
    for stmt in node.body:
        if isinstance(stmt, ast.Raise):
            return True
        if isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Call):
            call = stmt.value
            if isinstance(call.func, ast.Attribute) and call.func.attr in (
                "critical",
                "error",
                "exception",
            ):
                # log then raise in next stmt
                continue
    # log.critical(...) followed by raise
    if len(node.body) >= 2 and isinstance(node.body[-1], ast.Raise):
        return True
    return False


def find_violations(path: str) -> list[tuple[int, str]]:
    rel = os.path.relpath(path, server_root()).replace(os.sep, "/")
    if rel.endswith(ALLOWLIST_SUFFIXES):
        return []

    try:
        source = open(path, encoding="utf-8").read()
        tree = ast.parse(source, filename=path)
    except (OSError, SyntaxError):
        return []

    violations: list[tuple[int, str]] = []
    for node in tree.body:
        if isinstance(node, ast.If) and _is_env_guard_test(node.test) and _body_raises(node):
            violations.append(
                (
                    node.lineno,
                    "Module-level env guard must not raise at import; validate at call time.",
                )
            )
    return violations


def main() -> int:
    root = server_root()
    total = 0
    for path in sorted(collect_py_files(root)):
        for line_no, message in find_violations(path):
            rel = os.path.relpath(path, root)
            print(f"{rel}:{line_no}:1: error: {message}", file=sys.stderr)
            total += 1

    if total:
        print(
            f"\nlint_import_time_env: {total} violation(s). "
            "Defer integration key checks to the function that calls the external API.",
            file=sys.stderr,
        )
        return 1
    print("lint_import_time_env: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
