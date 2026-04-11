#!/usr/bin/env python3
"""
Compare backend Flask routes with OpenAPI documented paths to find missing documentation.
"""

import re
import yaml
from pathlib import Path

def extract_backend_routes():
    """Extract all route definitions from backend Python files."""
    routes_dir = Path("../Server/app/routes")
    backend_routes = set()

    route_patterns = [
        r'@\w+_bp\.route\(["\']([^"\']+)["\'].*methods=\[["\']([^"\']+)["\']',  # Decorator style
        r'\.route\(["\']([^"\']+)["\'].*methods=\[["\']([^"\']+)["\']',  # Direct registration
        r'bp\.route\(["\']([^"\']+)["\'].*methods=\[["\']([^"\']+)["\']',  # bp style
    ]

    for py_file in routes_dir.rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue

        try:
            content = py_file.read_text()
            for pattern in route_patterns:
                matches = re.findall(pattern, content)
                for path, method in matches:
                    # Normalize path parameters
                    normalized_path = re.sub(r'<[^>]+>', lambda m: '{' + m.group(0)[1:-1].split(':')[-1] + '}', path)
                    backend_routes.add((method.upper(), normalized_path))
        except Exception as e:
            print(f"Error reading {py_file}: {e}")

    return backend_routes

def extract_openapi_paths():
    """Extract all documented paths from OpenAPI spec."""
    openapi_file = Path("openapi.yaml")
    openapi_paths = set()

    try:
        with open(openapi_file) as f:
            spec = yaml.safe_load(f)

        if 'paths' in spec:
            for path, methods in spec['paths'].items():
                for method in methods.keys():
                    if method in ['get', 'post', 'put', 'patch', 'delete']:
                        openapi_paths.add((method.upper(), path))
    except Exception as e:
        print(f"Error reading OpenAPI spec: {e}")

    return openapi_paths

def main():
    print("Analyzing backend routes vs OpenAPI documentation...\n")

    backend_routes = extract_backend_routes()
    openapi_paths = extract_openapi_paths()

    print(f"Backend routes found: {len(backend_routes)}")
    print(f"OpenAPI paths found: {len(openapi_paths)}")
    print()

    # Find missing routes
    missing = backend_routes - openapi_paths

    if missing:
        print(f"Found {len(missing)} routes in backend but missing from OpenAPI:\n")
        for method, path in sorted(missing):
            print(f"  {method:7} {path}")
    else:
        print("All backend routes are documented in OpenAPI!")

    # Find documented but not in backend (might be old/removed)
    extra = openapi_paths - backend_routes
    if extra:
        print(f"\n\nFound {len(extra)} paths in OpenAPI but not in backend:")
        print("(These might use different patterns or be removed)\n")
        for method, path in sorted(extra):
            print(f"  {method:7} {path}")

if __name__ == "__main__":
    main()
