"""
Report how many OpenAPI path entries are covered by contract tests.

This does not fail on low percentages; it documents drift risk and should be tightened over time.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
import yaml

_REPO_ROOT = Path(__file__).resolve().parents[3]
_OPENAPI_PATH = _REPO_ROOT / "openapi" / "openapi.yaml"

# Path templates or prefixes exercised by tests/contract/test_openapi_contracts.py
_CONTRACT_TESTED_PATHS: frozenset[str] = frozenset(
    {
        "/api/v1/user/profile",
        "/api/v1/user/favorite-homes",
        "/api/v1/agent/search-agents",
        "/api/v1/agent/recommended-agents",
        "/api/v1/auth/login",
    }
)


def _path_is_covered(openapi_path: str) -> bool:
    normalized = openapi_path.rstrip("/") or openapi_path
    for prefix in _CONTRACT_TESTED_PATHS:
        if normalized == prefix or normalized.startswith(prefix + "/"):
            return True
    return False


@pytest.mark.api
@pytest.mark.contract
def test_openapi_contract_path_coverage_report(capsys: pytest.CaptureFixture[str]) -> None:
    assert _OPENAPI_PATH.is_file(), f"Missing OpenAPI spec at {_OPENAPI_PATH}"

    with _OPENAPI_PATH.open(encoding="utf-8") as f:
        spec = yaml.safe_load(f)

    paths = spec.get("paths") or {}
    path_keys = sorted(paths.keys())
    covered = [p for p in path_keys if _path_is_covered(p)]
    pct = (len(covered) / len(path_keys) * 100) if path_keys else 0.0

    lines = [
        "OpenAPI contract test coverage (path entries)",
        f"  Spec: {_OPENAPI_PATH}",
        f"  Total path keys: {len(path_keys)}",
        f"  Covered by contract tests: {len(covered)} ({pct:.1f}%)",
        "  Covered paths:",
        *(f"    - {p}" for p in covered),
        "  Declared contract-tested prefixes:",
        *(f"    - {p}" for p in sorted(_CONTRACT_TESTED_PATHS)),
    ]
    report = "\n".join(lines) + "\n"
    with capsys.disabled():
        sys.stdout.write(report)

    assert len(covered) >= len(_CONTRACT_TESTED_PATHS), (
        "Expected at least as many covered path keys as declared contract prefixes; "
        f"got {len(covered)} covered vs {len(_CONTRACT_TESTED_PATHS)} prefixes"
    )
