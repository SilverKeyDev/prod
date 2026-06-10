"""Shared Flask route inventory vs PostHog ``api_request`` coverage helpers."""

from __future__ import annotations

import json
import os
from pathlib import Path

from scripts.endpoints.github_actions_log import fail

try:
    import requests
except ImportError:
    requests = None  # type: ignore[assignment, unused-ignore]

SERVER_DIR = Path(__file__).resolve().parents[2]
INVENTORY_PATH = SERVER_DIR / "endpoints.json"
ENV_PATH = SERVER_DIR / ".env"

OBSERVATION_WINDOW_DAYS = 7

HOGQL_OBSERVED_ENDPOINTS = f"""
SELECT DISTINCT properties.endpoint
FROM events
WHERE event = 'api_request'
  AND timestamp > now() - INTERVAL {OBSERVATION_WINDOW_DAYS} DAY
""".strip()

# Routes excluded from "dead" reporting (telemetry blind spots or legitimately rare).
DEAD_ENDPOINT_ALLOWLIST: frozenset[str] = frozenset(
    {
        # SSE streams are skipped by api_telemetry (text/event-stream).
        "GET /api/v1/agent/chats/stream",
        # Webhooks may have zero traffic in the observation window.
        "POST /api/v1/webhooks/docusign/connect",
        "POST /api/v1/google/calendar/webhook",
    }
)

EVENT_INVENTORY_SYNC = "endpoint_inventory_sync"
EVENT_DEAD_ROUTE = "endpoint_dead_route"
SYNC_DISTINCT_ID = "ci-deploy-pipeline"


def _load_dotenv_if_present() -> None:
    """Load Server/.env for unset vars; explicit process env always wins."""
    if not ENV_PATH.is_file():
        return
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(ENV_PATH, override=False)


def load_inventory() -> list[str]:
    if not INVENTORY_PATH.is_file():
        fail(f"Route inventory not found: {INVENTORY_PATH}", hint="Run: make routes-extract")
    try:
        data = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"Invalid JSON in {INVENTORY_PATH}: {exc}")
    if not isinstance(data, list):
        fail(f"Expected JSON array in {INVENTORY_PATH}")
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


def query_observed_endpoints(query_api_key: str, *, posthog_query_url: str) -> set[str]:
    if requests is None:
        fail("The 'requests' package is required.")

    response = requests.post(
        posthog_query_url,
        headers={
            "Authorization": f"Bearer {query_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "query": {
                "kind": "HogQLQuery",
                "query": HOGQL_OBSERVED_ENDPOINTS,
            }
        },
        timeout=60,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        hint = None
        if response.status_code in (401, 403):
            hint = "POSTHOG_QUERY_API_KEY may be invalid, expired, or missing query:read scope."
        body_snippet = (response.text or "")[:500]
        fail(
            f"PostHog HogQL query failed (HTTP {response.status_code}): {exc}"
            + (f" — {body_snippet}" if body_snippet else ""),
            hint=hint,
        )

    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        fail(f"PostHog query returned invalid JSON: {exc}")

    results = payload.get("results") or []
    observed: set[str] = set()
    for row in results:
        if isinstance(row, list) and row:
            observed.add(str(row[0]))
        elif isinstance(row, str):
            observed.add(row)
    return observed


def require_env(name: str) -> str:
    _load_dotenv_if_present()
    value = os.getenv(name, "").strip()
    if not value:
        hint = f"Also checked {ENV_PATH}." if ENV_PATH.is_file() else None
        fail(f"Missing required env var {name}.", hint=hint)
    return value


def build_coverage_report(
    inventory: list[str],
    observed: set[str],
    *,
    allowlist: frozenset[str] = DEAD_ENDPOINT_ALLOWLIST,
) -> dict[str, object]:
    dead = compute_dead_endpoints(inventory, observed, allowlist=allowlist)
    allowlisted = sorted(set(inventory) & allowlist)
    return {
        "inventory_count": len(inventory),
        "observed_count": len(observed),
        "dead_endpoints": dead,
        "dead_count": len(dead),
        "allowlisted": allowlisted,
        "allowlisted_count": len(allowlisted),
        "observation_window_days": OBSERVATION_WINDOW_DAYS,
    }
