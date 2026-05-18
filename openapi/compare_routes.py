#!/usr/bin/env python3
"""
Compare backend Flask routes with OpenAPI documented paths to find missing documentation.

Run from repo root:
  python3 openapi/compare_routes.py

Or from openapi/ (legacy):
  cd openapi && python3 compare_routes.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
ROUTES_DIR = REPO_ROOT / "Server" / "app" / "routes"
OPENAPI_MODULAR = SCRIPT_DIR / "openapi.yaml"
OPENAPI_BUNDLED = REPO_ROOT / "openapi.yaml"


def _openapi_spec_path() -> Path:
    if OPENAPI_BUNDLED.is_file():
        return OPENAPI_BUNDLED
    return OPENAPI_MODULAR


def extract_backend_routes() -> set[tuple[str, str]]:
    """Extract route definitions from backend Python files."""
    backend_routes: set[tuple[str, str]] = set()

    route_patterns = [
        r'@\w+_bp\.route\(["\']([^"\']+)["\'].*methods=\[["\']([^"\']+)["\']',
        r'\.route\(["\']([^"\']+)["\'].*methods=\[["\']([^"\']+)["\']',
        r'bp\.route\(["\']([^"\']+)["\'].*methods=\[["\']([^"\']+)["\']',
    ]

    if not ROUTES_DIR.is_dir():
        print(f"Error: routes directory not found: {ROUTES_DIR}", file=sys.stderr)
        return backend_routes

    for py_file in ROUTES_DIR.rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue
        try:
            content = py_file.read_text(encoding="utf-8")
        except OSError as exc:
            print(f"Error reading {py_file}: {exc}", file=sys.stderr)
            continue
        for pattern in route_patterns:
            for path, method in re.findall(pattern, content):
                normalized = re.sub(
                    r"<[^>]+>",
                    lambda m: "{" + m.group(0)[1:-1].split(":")[-1] + "}",
                    path,
                )
                backend_routes.add((method.upper(), normalized))

    return backend_routes


def extract_openapi_paths() -> set[tuple[str, str]]:
    """Extract documented paths from the modular or bundled OpenAPI spec."""
    openapi_file = _openapi_spec_path()
    openapi_paths: set[tuple[str, str]] = set()

    try:
        with openapi_file.open(encoding="utf-8") as handle:
            spec = yaml.safe_load(handle)
    except OSError as exc:
        print(f"Error reading OpenAPI spec {openapi_file}: {exc}", file=sys.stderr)
        return openapi_paths

    for path, methods in (spec or {}).get("paths", {}).items():
        for method in methods:
            if method in ("get", "post", "put", "patch", "delete"):
                openapi_paths.add((method.upper(), path))

    return openapi_paths


def main() -> int:
    spec_path = _openapi_spec_path()
    print(f"OpenAPI spec: {spec_path.relative_to(REPO_ROOT)}")
    print("Analyzing backend routes vs OpenAPI documentation...\n")

    backend_routes = extract_backend_routes()
    openapi_paths = extract_openapi_paths()

    print(f"Backend routes found: {len(backend_routes)}")
    print(f"OpenAPI paths found: {len(openapi_paths)}")
    print()

    missing = backend_routes - openapi_paths
    if missing:
        print(f"Found {len(missing)} routes in backend but missing from OpenAPI:\n")
        for method, path in sorted(missing):
            print(f"  {method:7} {path}")
    else:
        print("All backend routes are documented in OpenAPI!")

    extra = openapi_paths - backend_routes
    if extra:
        print(f"\nFound {len(extra)} paths in OpenAPI but not matched in backend scan:")
        print("(May use different registration patterns or be deprecated)\n")
        for method, path in sorted(extra):
            print(f"  {method:7} {path}")

    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
