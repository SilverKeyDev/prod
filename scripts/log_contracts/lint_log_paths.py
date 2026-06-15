#!/usr/bin/env python3
"""
Lint SilverKey log call sites against generated log contracts.

Checks:
  1. No LOG_CATEGORIES / API_SUBCATEGORIES legacy patterns in log calls (same as migrate --check)
  2. Static dot-notation LogPath first arguments must appear in LOG_PATHS from categories.yaml codegen

Called by: Server/scripts/lint/lint_log_contracts.py; scripts/ci/run-all-linters.sh
"""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

from migrate_log_paths import find_remaining_violations, iter_files

ROOT = Path(__file__).resolve().parent.parent.parent
GENERATED_PY = ROOT / "Server" / "logger" / "core" / "categories_generated.py"

LOG_METHODS = frozenset({"debug", "info", "warn", "error", "security"})
PATH_SHAPE = re.compile(r"^[A-Z][A-Z0-9_]+(\.[A-Z][A-Z0-9_]+)*$")
TS_LOG_CALL = re.compile(
    r"\blog\.(debug|info|warn|error|security)\(\s*(['\"])([A-Z][A-Z0-9_.]+)\2"
)


def load_log_paths() -> frozenset[str]:
    """Read LOG_PATHS from codegen output without importing Server/logger (Flask-free)."""
    text = GENERATED_PY.read_text(encoding="utf-8")
    match = re.search(r"LOG_PATHS: tuple\[str, \.\.\.\] = \(([\s\S]*?)\)\n", text)
    if not match:
        raise RuntimeError(f"LOG_PATHS not found in {GENERATED_PY}")
    paths = re.findall(r'"([^"]+)"', match.group(1))
    if not paths:
        raise RuntimeError(f"LOG_PATHS is empty in {GENERATED_PY}")
    return frozenset(paths)


def _static_string_arg(node: ast.AST) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    return None


def _silverkey_log_receivers(tree: ast.Module) -> frozenset[str]:
    receivers: set[str] = set()
    sk_get_logger = False

    for node in tree.body:
        if isinstance(node, ast.ImportFrom) and node.module == "logger":
            for alias in node.names:
                name = alias.asname or alias.name
                if alias.name == "log":
                    receivers.add(name)
                if alias.name == "get_logger":
                    sk_get_logger = True
        if isinstance(node, ast.Assign) and sk_get_logger:
            value = node.value
            if (
                isinstance(value, ast.Call)
                and isinstance(value.func, ast.Name)
                and value.func.id == "get_logger"
            ):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        receivers.add(target.id)

    return frozenset(receivers)


def lint_python_file(path: Path, log_paths: frozenset[str]) -> list[str]:
    text = path.read_text(encoding="utf-8")
    try:
        tree = ast.parse(text, filename=str(path))
    except SyntaxError as exc:
        return [f"syntax error: {exc}"]

    receivers = _silverkey_log_receivers(tree)
    if not receivers:
        return []

    violations: list[str] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not isinstance(func, ast.Attribute) or func.attr not in LOG_METHODS:
            continue
        if not isinstance(func.value, ast.Name) or func.value.id not in receivers:
            continue
        if not node.args:
            continue
        first = _static_string_arg(node.args[0])
        if not first or not PATH_SHAPE.match(first):
            continue
        if first not in log_paths:
            violations.append(
                f"{path.relative_to(ROOT)}:{node.lineno}:1: error: "
                f'Unknown LogPath "{first}"; use a path from scripts/log_contracts/categories.yaml '
                f"(run make log-contracts)."
            )
    return violations


def lint_ts_file(path: Path, log_paths: frozenset[str]) -> list[str]:
    text = path.read_text(encoding="utf-8")
    violations: list[str] = []
    for match in TS_LOG_CALL.finditer(text):
        path_literal = match.group(3)
        if not PATH_SHAPE.match(path_literal) or path_literal in log_paths:
            continue
        line = text.count("\n", 0, match.start()) + 1
        violations.append(
            f"{path.relative_to(ROOT)}:{line}:1: error: "
            f'Unknown LogPath "{path_literal}"; use a path from scripts/log_contracts/categories.yaml '
            f"(run make log-contracts)."
        )
    return violations


def main() -> int:
    log_paths = load_log_paths()
    all_violations: list[str] = []

    for path in iter_files():
        legacy = find_remaining_violations(path.read_text(encoding="utf-8"))
        if legacy:
            all_violations.append(
                f"{path.relative_to(ROOT)}:1:1: error: "
                f"Legacy log category usage ({', '.join(legacy)}); "
                f"run make log-contracts-migrate or use dot-notation LogPath strings."
            )
            continue

        if path.suffix == ".py":
            all_violations.extend(lint_python_file(path, log_paths))
        else:
            all_violations.extend(lint_ts_file(path, log_paths))

    if all_violations:
        print("Log contract lint violations:")
        for item in all_violations:
            print(f"  {item}")
        print(f"\n{len(all_violations)} violation(s).")
        return 1

    print("Log contract lint: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
