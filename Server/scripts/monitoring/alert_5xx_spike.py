#!/usr/bin/env python3
"""Alert to Slack when PostHog observes an API 5xx spike."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

try:
    import requests
except ImportError:
    sys.stderr.write("alert_5xx_spike: the 'requests' package is required.\n")
    sys.exit(1)

SERVER_DIR = Path(__file__).resolve().parents[2]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from scripts.endpoints.posthog_constants_loader import load_posthog_constants  # noqa: E402

POSTHOG_QUERY_URL = load_posthog_constants().POSTHOG_QUERY_URL


def build_hogql(*, window_minutes: int) -> str:
    return f"""
SELECT count() AS errors_5xx
FROM events
WHERE event = 'api_request'
  AND properties.status_code >= 500
  AND timestamp > now() - INTERVAL {int(window_minutes)} MINUTE
""".strip()


def query_5xx_count(api_key: str, *, window_minutes: int) -> int:
    response = requests.post(
        POSTHOG_QUERY_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "query": {
                "kind": "HogQLQuery",
                "query": build_hogql(window_minutes=window_minutes),
            }
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    results = payload.get("results") or []
    if not results:
        return 0
    row = results[0]
    if isinstance(row, list) and row:
        return int(row[0] or 0)
    return int(row or 0)


def post_slack_alert(webhook_url: str, *, text: str) -> None:
    payload = json.dumps({"text": text}).encode("utf-8")
    request = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        response.read()


def build_alert_text(*, service_name: str, count: int, threshold: int, window_minutes: int) -> str:
    return (
        f":rotating_light: {service_name} 5xx spike detected\n"
        f"5xx count: {count}\n"
        f"Threshold: {threshold}\n"
        f"Window: {window_minutes} minute(s)\n"
        "Source: PostHog api_request telemetry"
    )


def _env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"missing required env var {name}")
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--window-minutes", type=int, default=5)
    parser.add_argument("--threshold", type=int, default=5)
    parser.add_argument("--service-name", default=os.getenv("SILVERKEY_SERVICE_NAME", "SilverKey"))
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.window_minutes < 1:
        sys.stderr.write("alert_5xx_spike: --window-minutes must be >= 1\n")
        return 2
    if args.threshold < 1:
        sys.stderr.write("alert_5xx_spike: --threshold must be >= 1\n")
        return 2

    try:
        api_key = _env("POSTHOG_QUERY_API_KEY")
        count = query_5xx_count(api_key, window_minutes=args.window_minutes)
    except Exception as exc:
        sys.stderr.write(f"alert_5xx_spike: PostHog query failed: {exc}\n")
        return 3

    if count < args.threshold:
        sys.stdout.write(
            f"alert_5xx_spike: OK count={count} threshold={args.threshold} "
            f"window_minutes={args.window_minutes}\n"
        )
        return 0

    text = build_alert_text(
        service_name=args.service_name,
        count=count,
        threshold=args.threshold,
        window_minutes=args.window_minutes,
    )
    if args.dry_run:
        sys.stdout.write(text + "\n")
        return 1

    try:
        post_slack_alert(_env("SLACK_ALERTS_WEBHOOK_URL"), text=text)
    except Exception as exc:
        sys.stderr.write(f"alert_5xx_spike: Slack alert failed: {exc}\n")
        return 4
    sys.stderr.write("alert_5xx_spike: threshold exceeded; Slack alert sent\n")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
