#!/usr/bin/env python3
"""POST full Flask route inventory to PostHog as an endpoint_inventory_sync event.

Requires env:

    POSTHOG_PROJECT_TOKEN   Project ingest key (phc_…)
    GITHUB_SHA              Optional; defaults to "local"

Usage:

    make endpoints-sync-posthog
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    sys.stderr.write("sync_inventory_posthog: the 'requests' package is required.\n")
    sys.exit(1)

SERVER_DIR = Path(__file__).resolve().parents[2]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from app.services.analytics.posthog_constants import POSTHOG_CAPTURE_URL  # noqa: E402

INVENTORY_PATH = SERVER_DIR / "endpoints.json"
CAPTURE_URL = POSTHOG_CAPTURE_URL
DISTINCT_ID = "ci-deploy-pipeline"
EVENT_NAME = "endpoint_inventory_sync"


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        sys.stderr.write(f"sync_inventory_posthog: missing required env var {name}\n")
        sys.exit(1)
    return value


def _load_inventory() -> list[str]:
    if not INVENTORY_PATH.is_file():
        sys.stderr.write(f"sync_inventory_posthog: inventory not found: {INVENTORY_PATH}\n")
        sys.stderr.write("Run: make routes-extract\n")
        sys.exit(1)
    try:
        data = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        sys.stderr.write(f"sync_inventory_posthog: invalid JSON in {INVENTORY_PATH}: {exc}\n")
        sys.exit(1)
    if not isinstance(data, list):
        sys.stderr.write(f"sync_inventory_posthog: expected JSON array in {INVENTORY_PATH}\n")
        sys.exit(1)
    return [str(item) for item in data]


def main() -> int:
    api_key = _require_env("POSTHOG_PROJECT_TOKEN")
    endpoints = _load_inventory()
    deploy_sha = (os.getenv("GITHUB_SHA") or "local").strip() or "local"

    payload = {
        "api_key": api_key,
        "event": EVENT_NAME,
        "distinct_id": DISTINCT_ID,
        "properties": {
            "endpoints": endpoints,
            "endpoint_count": len(endpoints),
            "deploy_sha": deploy_sha,
            "$process_person_profile": False,
        },
    }

    try:
        response = requests.post(CAPTURE_URL, json=payload, timeout=30)
        response.raise_for_status()
    except requests.RequestException as exc:
        sys.stderr.write(f"sync_inventory_posthog: PostHog capture failed: {exc}\n")
        return 1

    print(
        f"sync_inventory_posthog: sent {len(endpoints)} endpoints "
        f"(deploy_sha={deploy_sha}) to PostHog"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
