#!/usr/bin/env python3
"""
Analyze OpenAPI validation coverage across route files.

Useful during migration to track progress and identify routes
that still need OpenAPI validation decorators.

Usage:
    python Server/scripts/validate-schema-coverage.py
    python Server/scripts/validate-schema-coverage.py --strict  # Exit 1 if gaps remain
"""

import argparse
import re
import sys
from pathlib import Path


def _route_handlers_missing_request_validation(content: str) -> list[str]:
    """Return handler names for POST/PUT/PATCH routes without @validate_request above them."""
    lines = content.splitlines()
    missing: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        route_match = re.search(
            r"\.route\([^)]*methods=\[[^\]]*[\"'](?:POST|PUT|PATCH)[\"']",
            line,
            re.IGNORECASE,
        )
        if route_match:
            # Walk upward for decorators; find def name within next 15 lines
            has_validate = False
            handler_name = "unknown"
            for j in range(max(0, i - 8), min(len(lines), i + 12)):
                if "@validate_request" in lines[j]:
                    has_validate = True
                fn_match = re.match(r"\s*def\s+(\w+)\s*\(", lines[j])
                if fn_match:
                    handler_name = fn_match.group(1)
            if not has_validate:
                missing.append(handler_name)
        i += 1
    return missing


def analyze_route_coverage(strict: bool = False):
    """
    Analyze which routes have OpenAPI validation.

    Args:
        strict: If True, exit with error if coverage < 100% or mutating routes lack validation

    Returns:
        Tuple of (total_routes, validated_routes, coverage_percent)
    """
    routes_dir = Path("Server/app/routes")

    if not routes_dir.exists():
        print(f"❌ Routes directory not found: {routes_dir}")
        sys.exit(1)

    total_routes = 0
    validated_routes = 0
    unvalidated_files: list[str] = []
    mutating_gaps: list[tuple[str, list[str]]] = []

    print("📊 Analyzing OpenAPI validation coverage...\n")

    for file in sorted(routes_dir.rglob("*.py")):
        if file.name.startswith("__") or "__pycache__" in str(file):
            continue

        content = file.read_text()

        has_routes = (
            "@" in content
            and (".route(" in content or "_bp.route(" in content)
            and "methods=[" in content
        )

        if not has_routes:
            continue

        total_routes += 1

        has_validation = "@validate_request" in content

        if has_validation:
            validated_routes += 1
        else:
            try:
                relative_path = file.relative_to(Path.cwd())
            except ValueError:
                relative_path = file
            unvalidated_files.append(str(relative_path))

        missing_handlers = _route_handlers_missing_request_validation(content)
        if missing_handlers:
            try:
                rel = str(file.relative_to(Path.cwd()))
            except ValueError:
                rel = str(file)
            mutating_gaps.append((rel, missing_handlers))

    coverage = (validated_routes / total_routes * 100) if total_routes > 0 else 0

    print(f"Total route files: {total_routes}")
    print(f"Files with validation: {validated_routes}")
    print(f"Files without validation: {total_routes - validated_routes}")
    print(f"Coverage: {coverage:.1f}%\n")

    if unvalidated_files:
        print("⚠️  Route files without OpenAPI validation imports/decorators:")
        for file_path in unvalidated_files[:10]:
            print(f"  - {file_path}")
        if len(unvalidated_files) > 10:
            print(f"  ... and {len(unvalidated_files) - 10} more")
        print()

    if mutating_gaps:
        print("⚠️  POST/PUT/PATCH handlers missing @validate_request:")
        for file_path, handlers in mutating_gaps[:10]:
            print(f"  - {file_path}: {', '.join(handlers)}")
        if len(mutating_gaps) > 10:
            print(f"  ... and {len(mutating_gaps) - 10} more files")
        print()

    if coverage == 100 and not mutating_gaps:
        print("✅ All route files use OpenAPI validation decorators!")
    elif coverage >= 80:
        print(f"🟡 Good progress: {coverage:.1f}% file coverage")
    else:
        print(f"🔴 Migration in progress: {coverage:.1f}% file coverage")

    if strict and (coverage < 100 or mutating_gaps):
        print("\n❌ Strict mode: validation gaps remain")
        sys.exit(1)

    return total_routes, validated_routes, coverage


def main():
    parser = argparse.ArgumentParser(
        description="Analyze OpenAPI validation coverage across routes"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with error if coverage or mutating-route validation is incomplete",
    )
    args = parser.parse_args()

    try:
        analyze_route_coverage(strict=args.strict)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
