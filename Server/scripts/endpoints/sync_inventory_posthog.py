#!/usr/bin/env python3
"""Sync Flask route inventory and dead-route coverage snapshot to PostHog.

**Why this exists**

Production emits ``api_request`` events for routes that were actually hit. The
committed ``Server/endpoints.json`` inventory lists every route Flask registers
(the full "expected" surface). Routes in inventory with zero ``api_request``
events in the last 7 days are **dead routes** — unused in prod, newly shipped,
admin-only, telemetry blind spots, or broken client wiring.

Posting inventory + dead routes to PostHog lets you:

- Build insights/tables filtered on ``endpoint_dead_route`` (one event per dead route)
- Join ``endpoint_inventory_sync`` snapshots to ``api_request`` volume in HogQL
- Track dead-route count over ``deploy_sha`` after each merge to main

Reads committed ``Server/endpoints.json`` only — no Flask app, no DATABASE_URL.

Requires env:

    POSTHOG_PROJECT_TOKEN    Project ingest key (phc_…) — capture API
    POSTHOG_QUERY_API_KEY    Personal API key with query:read — HogQL for observed traffic
    GITHUB_SHA               Optional; defaults to "local"

Usage:

    make endpoints-sync-posthog

Exits non-zero when secrets are missing/invalid, HogQL query fails, ingest fails,
or (in GitHub Actions) PostHog does not show the sync within the verification window.
Failures emit ``::error::`` annotations in Actions logs.
"""

from __future__ import annotations

import os
import sys
import traceback
from pathlib import Path

try:
    import requests
except ImportError:
    print(
        "sync_inventory_posthog: ERROR: the 'requests' package is required.",
        file=sys.stderr,
        flush=True,
    )
    if os.getenv("GITHUB_ACTIONS", "").lower() == "true":
        print("::error::requests package is required", file=sys.stderr, flush=True)
    sys.exit(1)

SERVER_DIR = Path(__file__).resolve().parents[2]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from scripts.endpoints.endpoint_coverage import (  # noqa: E402
    EVENT_DEAD_ROUTE,
    EVENT_INVENTORY_SYNC,
    SYNC_DISTINCT_ID,
    build_coverage_report,
    load_inventory,
    query_observed_endpoints,
)
from scripts.endpoints.github_actions_log import fail, log_notice  # noqa: E402
from scripts.endpoints.posthog_constants_loader import load_posthog_constants  # noqa: E402
from scripts.endpoints.posthog_sync_validate import (  # noqa: E402
    INGEST_KEY_PREFIXES,
    QUERY_KEY_PREFIXES,
    validate_batch_response,
    validate_ingest_response,
    validate_key_prefix,
    validate_observed_traffic,
    validate_secret_present,
    verify_inventory_sync_ingested,
)

POSTHOG_CAPTURE_URL = load_posthog_constants().POSTHOG_CAPTURE_URL
POSTHOG_QUERY_URL = load_posthog_constants().POSTHOG_QUERY_URL
POSTHOG_BATCH_URL = POSTHOG_CAPTURE_URL.replace("/capture/", "/batch/")
BATCH_CHUNK_SIZE = 50


def _resolve_credentials() -> tuple[str, str]:
    log_notice("Validating PostHog credentials…")
    ingest_key = validate_secret_present(
        "POSTHOG_PROJECT_TOKEN", os.getenv("POSTHOG_PROJECT_TOKEN")
    )
    query_key = validate_secret_present("POSTHOG_QUERY_API_KEY", os.getenv("POSTHOG_QUERY_API_KEY"))
    validate_key_prefix("POSTHOG_PROJECT_TOKEN", ingest_key, prefixes=INGEST_KEY_PREFIXES)
    validate_key_prefix("POSTHOG_QUERY_API_KEY", query_key, prefixes=QUERY_KEY_PREFIXES)
    return ingest_key, query_key


def _post_capture(payload: dict) -> None:
    response = requests.post(POSTHOG_CAPTURE_URL, json=payload, timeout=30)
    validate_ingest_response(response, operation="endpoint_inventory_sync capture")


def _post_batch_chunks(ingest_key: str, events: list[dict]) -> None:
    if not events:
        log_notice("No dead routes to post (endpoint_dead_route batch skipped).")
        return
    total_chunks = (len(events) + BATCH_CHUNK_SIZE - 1) // BATCH_CHUNK_SIZE
    for index, offset in enumerate(range(0, len(events), BATCH_CHUNK_SIZE), start=1):
        chunk = events[offset : offset + BATCH_CHUNK_SIZE]
        log_notice(
            f"Posting endpoint_dead_route batch {index}/{total_chunks} ({len(chunk)} events)…"
        )
        response = requests.post(
            POSTHOG_BATCH_URL,
            json={"api_key": ingest_key, "batch": chunk},
            timeout=60,
        )
        validate_batch_response(response, expected_events=len(chunk))


def _write_github_step_summary(report: dict[str, object], *, deploy_sha: str) -> None:
    """Surface dead routes in the Actions job summary (not only PostHog)."""
    summary_path = (os.getenv("GITHUB_STEP_SUMMARY") or "").strip()
    if not summary_path:
        return

    dead: list[str] = report["dead_endpoints"]  # type: ignore[assignment]
    window_days: int = report["observation_window_days"]  # type: ignore[assignment]
    lines = [
        "## API endpoint coverage (PostHog sync)",
        "",
        f"- **Deploy SHA:** `{deploy_sha}`",
        f"- **Inventory:** {report['inventory_count']} routes",
        f"- **Observed** (`api_request`, {window_days}d): {report['observed_count']}",
        f"- **Dead routes posted:** {report['dead_count']} (`endpoint_dead_route` events)",
        "",
        "### PostHog table",
        "",
        "Use event **`endpoint_dead_route`** (one row per dead route). "
        "`endpoint_inventory_sync` stores `dead_endpoints` as an array — "
        "standard table insights will not expand that to one row per route.",
        "",
    ]
    if dead:
        lines.append("### Dead routes this sync")
        lines.append("")
        for endpoint in dead:
            lines.append(f"- `{endpoint}`")
    else:
        lines.append("_No dead routes in this window._")

    Path(summary_path).write_text("\n".join(lines) + "\n", encoding="utf-8")


def _build_dead_route_batch(
    dead_endpoints: list[str],
    *,
    deploy_sha: str,
    observation_window_days: int,
) -> list[dict]:
    batch: list[dict] = []
    for endpoint in dead_endpoints:
        batch.append(
            {
                "event": EVENT_DEAD_ROUTE,
                "distinct_id": SYNC_DISTINCT_ID,
                "properties": {
                    "endpoint": endpoint,
                    "deploy_sha": deploy_sha,
                    "observation_window_days": observation_window_days,
                    "$process_person_profile": False,
                },
            }
        )
    return batch


def _print_coverage_report(report: dict[str, object]) -> None:
    inventory_count = report["inventory_count"]
    observed_count = report["observed_count"]
    dead = report["dead_endpoints"]
    allowlisted_count = report["allowlisted_count"]
    window_days = report["observation_window_days"]

    print(f"Inventory: {inventory_count} endpoints", flush=True)
    print(f"Observed in PostHog ({window_days}d): {observed_count} distinct endpoints", flush=True)
    if allowlisted_count:
        print(f"Allowlisted (excluded from dead report): {allowlisted_count}", flush=True)

    if dead:
        print(
            f"\nDead endpoints ({len(dead)}) — in inventory but no recent api_request events:",
            flush=True,
        )
        for endpoint in dead:
            print(f"  {endpoint}", flush=True)
    else:
        print(
            "\nAll inventory endpoints have api_request events in the observation window.",
            flush=True,
        )


def sync_endpoint_coverage_to_posthog() -> int:
    ingest_key, query_key = _resolve_credentials()

    log_notice("Loading Server/endpoints.json…")
    inventory = load_inventory()
    if len(inventory) == 0:
        fail("Route inventory is empty.", hint="Run: make routes-extract")

    log_notice("Querying PostHog for observed api_request endpoints (7d)…")
    observed = query_observed_endpoints(query_key, posthog_query_url=POSTHOG_QUERY_URL)

    report = build_coverage_report(inventory, observed)
    validate_observed_traffic(
        int(report["observed_count"]),  # type: ignore[arg-type]
        int(report["inventory_count"]),  # type: ignore[arg-type]
    )

    dead_endpoints: list[str] = report["dead_endpoints"]  # type: ignore[assignment]
    deploy_sha = (os.getenv("GITHUB_SHA") or "local").strip() or "local"
    window_days: int = report["observation_window_days"]  # type: ignore[assignment]
    dead_count = int(report["dead_count"])

    log_notice(
        f"Coverage: inventory={report['inventory_count']} observed={report['observed_count']} "
        f"dead={dead_count} deploy_sha={deploy_sha}"
    )

    inventory_payload = {
        "api_key": ingest_key,
        "event": EVENT_INVENTORY_SYNC,
        "distinct_id": SYNC_DISTINCT_ID,
        "properties": {
            "endpoints": inventory,
            "endpoint_count": report["inventory_count"],
            "observed_endpoint_count": report["observed_count"],
            "dead_endpoints": dead_endpoints,
            "dead_endpoint_count": dead_count,
            "allowlisted_endpoint_count": report["allowlisted_count"],
            "observation_window_days": window_days,
            "deploy_sha": deploy_sha,
            "$process_person_profile": False,
        },
    }

    log_notice("Posting endpoint_inventory_sync to PostHog…")
    try:
        _post_capture(inventory_payload)
        dead_batch = _build_dead_route_batch(
            dead_endpoints,
            deploy_sha=deploy_sha,
            observation_window_days=window_days,
        )
        _post_batch_chunks(ingest_key, dead_batch)
    except SystemExit:
        raise
    except requests.RequestException as exc:
        fail(f"PostHog capture failed: {exc}")

    log_notice("Verifying ingest in PostHog (HogQL)…")
    verify_inventory_sync_ingested(
        query_key,
        posthog_query_url=POSTHOG_QUERY_URL,
        deploy_sha=deploy_sha,
        expected_dead_count=dead_count,
    )

    print(
        f"sync_inventory_posthog: OK — endpoint_inventory_sync "
        f"({report['inventory_count']} routes, dead_endpoint_count={dead_count}) "
        f"and {dead_count} endpoint_dead_route events "
        f"(deploy_sha={deploy_sha})",
        flush=True,
    )
    _print_coverage_report(report)
    _write_github_step_summary(report, deploy_sha=deploy_sha)
    return 0


def main() -> int:
    try:
        return sync_endpoint_coverage_to_posthog()
    except SystemExit as exc:
        code = exc.code if isinstance(exc.code, int) else 1
        if code not in (0, None):
            print(
                f"sync_inventory_posthog: exiting with status {code}",
                file=sys.stderr,
                flush=True,
            )
        raise
    except Exception as exc:
        fail(
            f"Unexpected error: {exc}",
            hint=traceback.format_exc().strip()[-500:],
        )


if __name__ == "__main__":
    raise SystemExit(main())
