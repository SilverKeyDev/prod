#!/usr/bin/env python3
"""Extract Flask route inventory for PostHog telemetry coverage checks.

Usage (from repo root, with Server venv active):

    python3 Server/scripts/endpoints/extract_routes.py

Or:

    make routes-extract

Writes sorted ``METHOD /path`` entries to ``Server/endpoints.json``.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[2]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

# Inventory generation only needs Flask url_map — no real DB or secrets (see tests/conftest.py).
os.environ.setdefault("TESTING", "true")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app import create_app  # noqa: E402
from app.http.api_telemetry import (  # noqa: E402
    _INVENTORY_EXCLUDED_METHODS,
    should_skip_route_for_inventory,
)
from app.utils.http.route_pattern import normalize_flask_route_rule  # noqa: E402

OUTPUT_PATH = SERVER_DIR / "endpoints.json"


def collect_route_entries() -> list[str]:
    app = create_app()
    entries: set[str] = set()
    with app.app_context():
        for rule in app.url_map.iter_rules():
            if should_skip_route_for_inventory(rule, rule.endpoint):
                continue
            normalized = normalize_flask_route_rule(rule.rule)
            for method in sorted(rule.methods or ()):
                if method in _INVENTORY_EXCLUDED_METHODS:
                    continue
                entries.add(f"{method} {normalized}")
    return sorted(entries)


def main() -> int:
    entries = collect_route_entries()
    OUTPUT_PATH.write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} endpoints to {OUTPUT_PATH.relative_to(SERVER_DIR.parent)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
