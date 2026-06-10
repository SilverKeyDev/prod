#!/usr/bin/env python3
"""
Check module-specific coverage thresholds.

Reads ``coverage/coverage.json`` (from pytest-cov) and enforces per-prefix
line floors defined in ``THRESHOLDS``. Raise those numbers gradually as the
full-suite baseline improves; keep each floor slightly below the current
measured percentage so CI catches regressions.
"""

import json
import sys
from pathlib import Path

# Module-specific thresholds (line coverage on matching files in coverage.json).
# Keep floors slightly below the current full-suite baseline so CI fails if a
# prefix regresses materially; raise toward aspirational targets over time.
THRESHOLDS = {
    "app/services/": 38.0,
    "app/routes/": 45.0,
    "app/models/": 65.0,
    "app/utils/": 52.0,
}


def load_coverage_data(coverage_file: Path) -> dict:
    """Load coverage data from JSON file."""
    if not coverage_file.exists():
        print(f"❌ Coverage file not found: {coverage_file}")
        sys.exit(1)

    with open(coverage_file) as f:
        return json.load(f)


def calculate_module_coverage(coverage_data: dict, module_prefix: str) -> tuple[float, int, int]:
    """
    Calculate coverage percentage for files matching the module prefix.

    Returns:
        Tuple of (coverage_percentage, covered_lines, total_lines)
    """
    total_statements = 0
    covered_statements = 0

    files = coverage_data.get("files", {})

    for file_path, file_data in files.items():
        # Normalize path separators
        normalized_path = file_path.replace("\\", "/")

        if module_prefix in normalized_path:
            summary = file_data.get("summary", {})
            total_statements += summary.get("num_statements", 0)
            covered_statements += summary.get("covered_lines", 0)

    if total_statements == 0:
        return 0.0, 0, 0

    coverage_pct = (covered_statements / total_statements) * 100
    return coverage_pct, covered_statements, total_statements


def check_thresholds(coverage_file: Path) -> bool:
    """
    Check if all module-specific thresholds are met.

    Returns:
        True if all thresholds met, False otherwise
    """
    coverage_data = load_coverage_data(coverage_file)

    print("\n" + "=" * 80)
    print("Module-Specific Coverage Thresholds")
    print("=" * 80 + "\n")

    all_passed = True
    results: list[tuple[str, float, float, bool]] = []

    for module, threshold in THRESHOLDS.items():
        coverage_pct, covered, total = calculate_module_coverage(coverage_data, module)

        passed = coverage_pct >= threshold
        all_passed = all_passed and passed

        results.append((module, coverage_pct, threshold, passed))

    # Print results
    for module, coverage_pct, threshold, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {module:<30} {coverage_pct:>6.2f}% (threshold: {threshold:.0f}%)")

    print("\n" + "=" * 80)

    if all_passed:
        print("✅ All module-specific coverage thresholds met!")
        return True
    else:
        print("❌ Some module-specific coverage thresholds not met.")
        print("\nTo improve coverage, add tests for the failing modules.")
        return False


def main():
    """Main entry point."""
    # Find coverage file
    coverage_file = Path(__file__).resolve().parents[2] / "coverage" / "coverage.json"

    if not coverage_file.exists():
        print("⚠️  Coverage file not found. Run tests with coverage first:")
        print("   pytest --cov=app --cov-report=json")
        sys.exit(1)

    success = check_thresholds(coverage_file)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
