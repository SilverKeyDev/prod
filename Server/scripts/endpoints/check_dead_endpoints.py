#!/usr/bin/env python3
"""Compare route inventory against PostHog ``api_request`` events (print-only).

For the same diff posted to PostHog as queryable events, use
``make endpoints-sync-posthog`` (``endpoint_inventory_sync`` +
``endpoint_dead_route``).

Requires env (or ``Server/.env`` fallback when ``python-dotenv`` is installed):

    POSTHOG_QUERY_API_KEY   Personal API key with query:read (PostHog user settings)

Usage:

    make endpoints-check-dead
"""

from __future__ import annotations

import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[2]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from scripts.endpoints.endpoint_coverage import (  # noqa: E402
    build_coverage_report,
    load_inventory,
    query_observed_endpoints,
    require_env,
)
from scripts.endpoints.posthog_constants_loader import load_posthog_constants  # noqa: E402

POSTHOG_QUERY_URL = load_posthog_constants().POSTHOG_QUERY_URL


def _print_coverage_report(report: dict[str, object]) -> None:
    inventory_count = report["inventory_count"]
    observed_count = report["observed_count"]
    dead = report["dead_endpoints"]
    allowlisted_count = report["allowlisted_count"]
    window_days = report["observation_window_days"]

    print(f"Inventory: {inventory_count} endpoints")
    print(f"Observed in PostHog ({window_days}d): {observed_count} distinct endpoints")
    if allowlisted_count:
        print(f"Allowlisted (excluded from dead report): {allowlisted_count}")

    if dead:
        print(f"\nDead endpoints ({len(dead)}) — in inventory but no recent api_request events:")
        for endpoint in dead:
            print(f"  {endpoint}")
    else:
        print("\nAll inventory endpoints have api_request events in the observation window.")


def main() -> int:
    query_key = require_env("POSTHOG_QUERY_API_KEY")
    inventory = load_inventory()
    observed = query_observed_endpoints(query_key, posthog_query_url=POSTHOG_QUERY_URL)
    report = build_coverage_report(inventory, observed)
    _print_coverage_report(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
