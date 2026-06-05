"""Validation helpers for PostHog endpoint coverage CI sync."""

from __future__ import annotations

import json
import time

import requests

from scripts.endpoints.github_actions_log import fail, is_github_actions, log_notice

PLACEHOLDER_KEY_VALUES = frozenset(
    {
        "",
        "changeme",
        "placeholder",
        "pytest-stub-posthog-not-for-production",
    }
)

INGEST_KEY_PREFIXES = ("phc_",)
QUERY_KEY_PREFIXES = ("phx_", "phc_")


def validate_secret_present(name: str, value: str | None) -> str:
    stripped = (value or "").strip()
    if stripped.lower() in PLACEHOLDER_KEY_VALUES:
        hint = (
            f"Add repository secret {name} in GitHub Settings → Secrets → Actions. "
            if is_github_actions()
            else f"Set env {name} or add it to Server/.env."
        )
        if name == "POSTHOG_QUERY_API_KEY":
            hint += " Use a personal API key with query:read from PostHog user settings."
        elif name == "POSTHOG_PROJECT_TOKEN":
            hint += " Use the project ingest key (phc_…) from PostHog project settings."
        fail(f"Missing or empty {name}.", hint=hint)
    return stripped


def validate_key_prefix(name: str, value: str, *, prefixes: tuple[str, ...]) -> None:
    if not any(value.startswith(prefix) for prefix in prefixes):
        fail(
            f"{name} has unexpected format (expected prefix {prefixes!r}, got {value[:12]}…).",
            hint="Copy the key from PostHog without quotes or whitespace.",
        )


def validate_ingest_response(response: requests.Response, *, operation: str) -> None:
    try:
        response.raise_for_status()
    except Exception as exc:
        hint = _http_error_hint(response.status_code, key_kind="ingest")
        body_snippet = (response.text or "")[:300]
        fail(
            f"{operation} HTTP {response.status_code}: {exc}"
            + (f" — response: {body_snippet}" if body_snippet else ""),
            hint=hint,
        )

    body = _parse_json_body(response, operation=operation)
    status = body.get("status")
    if status not in (1, "Ok", "ok", True, None):
        fail(f"{operation} returned unexpected status: {body!r}")


def validate_batch_response(response: requests.Response, *, expected_events: int) -> None:
    try:
        response.raise_for_status()
    except Exception as exc:
        hint = _http_error_hint(response.status_code, key_kind="ingest")
        body_snippet = (response.text or "")[:300]
        fail(
            f"endpoint_dead_route batch HTTP {response.status_code}: {exc}"
            + (f" — response: {body_snippet}" if body_snippet else ""),
            hint=hint,
        )

    body = _parse_json_body(response, operation="batch ingest")
    status = body.get("status")
    if status not in ("Ok", "ok", 1, True, None):
        fail(f"batch ingest returned unexpected status: {body!r}")

    if expected_events > 0 and status is None and not body:
        fail("batch ingest returned empty body; dead routes may not have been recorded.")


def _parse_json_body(response: requests.Response, *, operation: str) -> dict:
    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        fail(f"{operation} returned non-JSON body: {response.text[:300]!r} ({exc})")
    if not isinstance(payload, dict):
        fail(f"{operation} returned unexpected JSON type: {type(payload).__name__}")
    return payload


def _http_error_hint(status_code: int, *, key_kind: str) -> str | None:
    if status_code not in (401, 403):
        return None
    if key_kind == "ingest":
        return "POSTHOG_PROJECT_TOKEN may be invalid or for a different PostHog project."
    return (
        "POSTHOG_QUERY_API_KEY may be invalid, expired, or missing query:read scope. "
        "Create a personal API key in PostHog user settings."
    )


def validate_observed_traffic(observed_count: int, inventory_count: int) -> None:
    """In CI, zero observed endpoints usually means the query key or project is wrong."""
    if not is_github_actions():
        return
    if inventory_count <= 0:
        return
    if observed_count > 0:
        return
    fail(
        "PostHog query returned zero api_request endpoints in the observation window.",
        hint=(
            "Confirm POSTHOG_QUERY_API_KEY has query:read, project id in "
            "posthog_constants.py matches the SilverKey project, and prod emits api_request."
        ),
    )


def verify_inventory_sync_ingested(
    query_api_key: str,
    *,
    posthog_query_url: str,
    deploy_sha: str,
    expected_dead_count: int,
    max_attempts: int = 9,
    sleep_seconds: float = 5.0,
    backoff_factor: float = 1.6,
    max_sleep_seconds: float = 30.0,
) -> None:
    """Check that ingest landed, tolerating PostHog's async capture→query lag.

    Capture (``/capture/``, ``/batch/``) is asynchronous: events flow through
    Kafka and ingestion before they are queryable via HogQL/ClickHouse. That lag
    is routinely longer than the ~25s a flat 5s × 6 loop allowed, which produced
    false failures even when capture succeeded. Poll with exponential backoff
    (capped) so transient lag is tolerated while a genuinely missing event still
    fails after a generous window (~3 min with defaults).
    """
    if not is_github_actions():
        return

    from scripts.endpoints.endpoint_coverage import EVENT_DEAD_ROUTE, EVENT_INVENTORY_SYNC

    hogql = f"""
SELECT
  countIf(event = '{_escape_sql(EVENT_INVENTORY_SYNC)}') AS inventory_syncs,
  countIf(event = '{_escape_sql(EVENT_DEAD_ROUTE)}') AS dead_route_events
FROM events
WHERE timestamp > now() - INTERVAL 2 HOUR
  AND properties.deploy_sha = '{_escape_sql(deploy_sha)}'
""".strip()

    last_error: str | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.post(
                posthog_query_url,
                headers={
                    "Authorization": f"Bearer {query_api_key}",
                    "Content-Type": "application/json",
                },
                json={"query": {"kind": "HogQLQuery", "query": hogql}},
                timeout=60,
            )
            response.raise_for_status()
            payload = response.json()
            row = (payload.get("results") or [None])[0]
            if not row or not isinstance(row, list | tuple) or len(row) < 2:
                last_error = f"unexpected verify query shape: {payload!r}"
            else:
                inventory_syncs = int(row[0] or 0)
                dead_events = int(row[1] or 0)
                if inventory_syncs < 1:
                    last_error = (
                        f"no endpoint_inventory_sync for deploy_sha={deploy_sha} yet "
                        f"(attempt {attempt}/{max_attempts})"
                    )
                elif expected_dead_count > 0 and dead_events < expected_dead_count:
                    last_error = (
                        f"expected >={expected_dead_count} endpoint_dead_route events, "
                        f"saw {dead_events} (attempt {attempt}/{max_attempts})"
                    )
                else:
                    log_notice(
                        "Verified PostHog ingest "
                        f"(inventory_syncs={inventory_syncs}, dead_route_events={dead_events})"
                    )
                    return
        except requests.RequestException as exc:
            last_error = str(exc)

        if attempt < max_attempts:
            delay = min(sleep_seconds * (backoff_factor ** (attempt - 1)), max_sleep_seconds)
            log_notice(f"Ingest verification waiting ({last_error}); retrying in {delay:.0f}s…")
            time.sleep(delay)

    fail(
        "PostHog ingest verification failed after capture.",
        hint=last_error or "Check ingest keys and PostHog project id.",
    )


def _escape_sql(value: str) -> str:
    return value.replace("'", "''")
