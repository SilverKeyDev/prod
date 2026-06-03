#!/usr/bin/env python3
"""
Migrate LOG_CATEGORIES enum / dict lookups to dot-notation LogPath string literals.

Called by: make log-contracts-migrate

Transforms:
  log.info(LOG_CATEGORIES.API, msg, data, API_SUBCATEGORIES.POLLING)
    -> log.info("API.POLLING", msg, data)
  log.warn(LOG_CATEGORIES.AUTH, msg, data)
    -> log.warn("AUTH", msg, data)
  log.warn(LOG_CATEGORIES["ERRORS"], msg, data)
    -> log.warn("ERRORS", msg, data)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

SCAN_DIRS = [
    ROOT / "Client/packages",
    ROOT / "Client/apps",
    ROOT / "Server/app",
    ROOT / "Server/logger",
]

SKIP_NAME_FRAGMENTS = (
    ".generated.",
    "categories.generated",
    "categories_generated",
)

SKIP_FILES = frozenset(
    {
        "categories.ts",
        "categories.py",
        "parseLogPath.ts",
        "parse_log_path.py",
        "checkCategoryEnabled.ts",
        "logger.ts",
    }
)

LOG_CALL = re.compile(
    r"(log|logger)\.(debug|info|warn|error|security)\(",
    re.MULTILINE,
)

# log.METHOD(LOG_CATEGORIES.API, a, b, API_SUBCATEGORIES.SUB)
API_STATIC_SUB = re.compile(
    r"(log|logger)\.(debug|info|warn|error|security)\(\s*"
    r"LOG_CATEGORIES\.API\s*,\s*"
    r"([^,]+?)\s*,\s*"
    r"([^,]+?)\s*,\s*"
    r"API_SUBCATEGORIES\.([A-Z_]+)\s*\)",
    re.DOTALL,
)

# log.METHOD("API", a, b, var) after category replacement — collapse 4th arg (multiline)
API_DYNAMIC_SUB = re.compile(
    r"(log|logger)\.(debug|info|warn|error|security)\(\s*"
    r'"API"\s*,\s*'
    r"([^,]+?)\s*,\s*"
    r"(?:undefined\s*,\s*)?"
    r"([A-Za-z_][A-Za-z0-9_]*)\s*\)",
    re.DOTALL,
)

CATEGORY_REF = re.compile(
    r"LOG_CATEGORIES(?:\[(?:\"|')([A-Z_]+)(?:\"|')\]|\.([A-Z_]+))"
)


def should_process(path: Path) -> bool:
    if path.suffix not in {".ts", ".tsx", ".py"}:
        return False
    if path.name in SKIP_FILES:
        return False
    path_str = str(path)
    if any(fragment in path_str for fragment in SKIP_NAME_FRAGMENTS):
        return False
    if path.name.endswith(".test.ts") and path.name == "parseLogPath.test.ts":
        return False
    if path.name == "test_parse_log_path.py":
        return False
    return True


def migrate_content(content: str) -> tuple[str, bool]:
    original = content

    def api_static(m: re.Match[str]) -> str:
        receiver, method, arg2, arg3, sub = m.groups()
        return f'{receiver}.{method}("API.{sub}", {arg2.strip()}, {arg3.strip()})'

    content = API_STATIC_SUB.sub(api_static, content)

    def api_dynamic(m: re.Match[str]) -> str:
        receiver, method, arg2, var = m.groups()
        return f'{receiver}.{method}(`API.${{{var}}}`, {arg2.strip()})'

    content = API_DYNAMIC_SUB.sub(api_dynamic, content)

    def category_ref(m: re.Match[str]) -> str:
        name = m.group(1) or m.group(2)
        return f'"{name}"'

    content = CATEGORY_REF.sub(category_ref, content)

    content = _cleanup_imports(content)
    return content, content != original


def _uses_symbol(content: str, symbol: str) -> bool:
    for line in content.splitlines():
        stripped = line.strip()
        if symbol not in line:
            continue
        if stripped.startswith("import ") or " from " in stripped and stripped.startswith(
            ("import ", "}")
        ):
            if symbol in stripped.split(" from ", 1)[0]:
                continue
        return True
    return False


def _cleanup_imports(content: str) -> str:
    if not _uses_symbol(content, "LOG_CATEGORIES"):
        content = re.sub(r",\s*LOG_CATEGORIES\b", "", content)
        content = re.sub(r"\bLOG_CATEGORIES\s*,\s*", "", content)
        content = re.sub(r"import\s*\{\s*LOG_CATEGORIES\s*\}\s*from[^\n]+\n", "", content)
        content = re.sub(
            r"from logger import LOG_CATEGORIES, get_logger",
            "from logger import get_logger",
            content,
        )
        content = re.sub(
            r"from logger import get_logger, LOG_CATEGORIES",
            "from logger import get_logger",
            content,
        )
    if not _uses_symbol(content, "API_SUBCATEGORIES"):
        content = re.sub(r",\s*API_SUBCATEGORIES\b", "", content)
        content = re.sub(r"\bAPI_SUBCATEGORIES\s*,\s*", "", content)
    content = re.sub(r"import\s*\{\s*,\s*", "import { ", content)
    content = re.sub(r",\s*\}\s*from", " } from", content)
    content = re.sub(r"import\s*\{\s*\}\s*from[^\n]+\n", "", content)
    return content


def find_remaining_violations(content: str) -> list[str]:
    violations: list[str] = []
    if re.search(r"log\.\w+\([^)]*LOG_CATEGORIES", content, re.DOTALL):
        violations.append("LOG_CATEGORIES in log call")
    elif CATEGORY_REF.search(content) and "log." in content:
        violations.append("LOG_CATEGORIES reference near log calls")
    if re.search(r"log\.\w+\([^)]*API_SUBCATEGORIES", content, re.DOTALL):
        violations.append("API_SUBCATEGORIES in log call")
    if re.search(
        r'log\.\w+\(\s*"API"\s*,[^,]+,[^,]+,\s*(?:undefined\s*,\s*)?[A-Za-z_][A-Za-z0-9_]*\s*\)',
        content,
        re.DOTALL,
    ):
        violations.append("log call with API + 4th subcategory arg")
    return violations


def iter_files() -> list[Path]:
    files: list[Path] = []
    for base in SCAN_DIRS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and should_process(path):
                files.append(path)
    return sorted(files)


def main() -> int:
    check_only = "--check" in sys.argv

    changed_files: list[Path] = []
    violation_files: list[tuple[Path, list[str]]] = []

    for path in iter_files():
        text = path.read_text(encoding="utf-8")
        violations = find_remaining_violations(text)
        if violations:
            violation_files.append((path, violations))

        if check_only:
            continue

        migrated, changed = migrate_content(text)
        if changed:
            path.write_text(migrated, encoding="utf-8")
            changed_files.append(path)
            print(f"  migrated {path.relative_to(ROOT)}")

    if check_only:
        if violation_files:
            print("Log path migration violations remain:")
            for path, reasons in violation_files:
                print(f"  {path.relative_to(ROOT)}: {', '.join(reasons)}")
            print(f"\n{len(violation_files)} file(s) need migration.")
            return 1
        print("No LOG_CATEGORIES log-call violations found in scanned paths.")
        return 0

    print(f"\nDone: {len(changed_files)} file(s) updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
