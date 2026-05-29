#!/usr/bin/env python3
"""Compare route inventory against PostHog ``api_request`` events from the last 7 days.

Requires env:

    POSTHOG_QUERY_API_KEY   Personal API key with query:read (PostHog user settings)

Usage:

    make endpoints-check-dead
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    sys.stderr.write("check_dead_endpoints: the 'requests' package is required.\n")
    sys.exit(1)

from app.services.analytics.posthog_constants import POSTHOG_QUERY_URL

SERVER_DIR = Path(__file__).resolve().parents[2]
INVENTORY_PATH = SERVER_DIR / "endpoints.json"

HOGQL = """
SELECT DISTINCT properties.endpoint
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL 7 DAY
""".strip()

# Endpoints excluded from "dead" reporting (telemetry blind spots or legitimately rare).
DEAD_ENDPOINT_ALLOWLIST: frozenset[str] = frozenset(
    {
        # SSE streams are skipped by api_telemetry (text/event-stream).
        "GET /api/v1/agent/chats/stream",
        # Admin/dev and webhook routes may have zero traffic in a 7-day window.
        "POST /api/v1/webhooks/docusign/connect",
        "POST /api/v1/google/calendar/webhook",
    }
)


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        sys.stderr.write(f"check_dead_endpoints: missing required env var {name}\n")
        sys.exit(1)
    return value


def _load_inventory() -> list[str]:
    if not INVENTORY_PATH.is_file():
        sys.stderr.write(f"check_dead_endpoints: inventory not found: {INVENTORY_PATH}\n")
        sys.stderr.write("Run: make routes-extract\n")
        sys.exit(1)
    try:
        data = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        sys.stderr.write(f"check_dead_endpoints: invalid JSON in {INVENTORY_PATH}: {exc}\n")
        sys.exit(1)
    if not isinstance(data, list):
        sys.stderr.write(f"check_dead_endpoints: expected JSON array in {INVENTORY_PATH}\n")
        sys.exit(1)
    return [str(item) for item in data]


def compute_dead_endpoints(
    inventory: list[str],
    observed: set[str],
    *,
    allowlist: frozenset[str] = DEAD_ENDPOINT_ALLOWLIST,
) -> list[str]:
    """Inventory routes with no recent api_request events, minus allowlisted paths."""
    dead = set(inventory) - observed - allowlist
    return sorted(dead)


def _query_posthog_endpoints(api_key: str) -> set[str]:
    url = POSTHOG_QUERY_URL
    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "query": {
                "kind": "HogQLQuery",
                "query": HOGQL,
            }
        },
        timeout=60,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        sys.stderr.write(
            f"check_dead_endpoints: PostHog query failed ({response.status_code}): {exc}\n"
        )
        if response.text:
            sys.stderr.write(response.text[:500] + "\n")
        sys.exit(1)

    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        sys.stderr.write(f"check_dead_endpoints: invalid PostHog response JSON: {exc}\n")
        sys.exit(1)

    results = payload.get("results") or []
    observed: set[str] = set()
    for row in results:
        if isinstance(row, list) and row:
            observed.add(str(row[0]))
        elif isinstance(row, str):
            observed.add(row)
    return observed


def main() -> int:
    api_key = _require_env("POSTHOG_QUERY_API_KEY")

    inventory = _load_inventory()
    observed = _query_posthog_endpoints(api_key)
    dead = compute_dead_endpoints(inventory, observed)
    allowlisted = sorted(set(inventory) & DEAD_ENDPOINT_ALLOWLIST)

    print(f"Inventory: {len(inventory)} endpoints")
    print(f"Observed in PostHog (7d): {len(observed)} distinct endpoints")
    if allowlisted:
        print(f"Allowlisted (excluded from dead report): {len(allowlisted)}")

    if dead:
        print(f"\nDead endpoints ({len(dead)}) — in inventory but no recent api_request events:")
        for endpoint in dead:
            print(f"  {endpoint}")
    else:
        print("\nAll inventory endpoints have api_request events in the last 7 days.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
