#!/usr/bin/env python3
"""
Analyze OpenAPI validation coverage across route files.

Useful during migration to track progress and identify routes
that still need OpenAPI validation decorators.

Usage:
    python Server/scripts/validate-schema-coverage.py
    python Server/scripts/validate-schema-coverage.py --strict  # Exit 1 if < 100%
"""

import argparse
import sys
from pathlib import Path


def analyze_route_coverage(strict: bool = False):
    """
    Analyze which routes have OpenAPI validation.

    Args:
        strict: If True, exit with error if coverage < 100%

    Returns:
        Tuple of (total_routes, validated_routes, coverage_percent)
    """
    # Find all route files
    routes_dir = Path("Server/app/routes")

    if not routes_dir.exists():
        print(f"❌ Routes directory not found: {routes_dir}")
        sys.exit(1)

    total_routes = 0
    validated_routes = 0
    unvalidated_files = []

    print("📊 Analyzing OpenAPI validation coverage...\n")

    for file in sorted(routes_dir.rglob("*.py")):
        # Skip __init__ and __pycache__
        if file.name.startswith("__") or "__pycache__" in str(file):
            continue

        content = file.read_text()

        # Check if file has route decorators
        has_routes = (
            "@" in content
            and (".route(" in content or "_bp.route(" in content)
            and "methods=[" in content
        )

        if has_routes:
            total_routes += 1

            # Check if file uses OpenAPI validation
            has_validation = (
                "from app.schemas import" in content
                or "from app.utils.validation import" in content
                or "@validate_request" in content
                or "@require_validated_user" in content
                or "@require_validated_agent" in content
            )

            if has_validation:
                validated_routes += 1
            else:
                try:
                    relative_path = file.relative_to(Path.cwd())
                except ValueError:
                    # File is not relative to cwd, use absolute path
                    relative_path = file
                unvalidated_files.append(str(relative_path))

    # Calculate coverage
    coverage = (validated_routes / total_routes * 100) if total_routes > 0 else 0

    # Print results
    print(f"Total route files: {total_routes}")
    print(f"Files with validation: {validated_routes}")
    print(f"Files without validation: {total_routes - validated_routes}")
    print(f"Coverage: {coverage:.1f}%\n")

    if unvalidated_files:
        print("⚠️  Routes files without OpenAPI validation:")
        for file_path in unvalidated_files[:10]:  # Show first 10
            print(f"  - {file_path}")
        if len(unvalidated_files) > 10:
            print(f"  ... and {len(unvalidated_files) - 10} more")
        print()

    # Status message
    if coverage == 100:
        print("✅ All routes using OpenAPI validation!")
    elif coverage >= 80:
        print(f"🟡 Good progress: {coverage:.1f}% coverage")
    elif coverage >= 50:
        print(f"🟠 Halfway there: {coverage:.1f}% coverage")
    else:
        print(f"🔴 Migration in progress: {coverage:.1f}% coverage")

    # Exit code
    if strict and coverage < 100:
        print("\n❌ Strict mode: Validation coverage < 100%")
        sys.exit(1)

    return total_routes, validated_routes, coverage


def main():
    parser = argparse.ArgumentParser(
        description="Analyze OpenAPI validation coverage across routes"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with error if coverage less than 100 percent",
    )
    args = parser.parse_args()

    try:
        analyze_route_coverage(strict=args.strict)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
