#!/usr/bin/env python3
"""External health probe that sends a Slack alert when SilverKey is down."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass


@dataclass(frozen=True)
class HealthCheckResult:
    ok: bool
    status_code: int | None
    elapsed_ms: int
    detail: str


def check_health(
    url: str, *, timeout_seconds: float, expect_status: int
) -> HealthCheckResult:
    start = time.perf_counter()
    request = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            body = response.read(256).decode("utf-8", errors="replace")
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            status_code = int(response.status)
            return HealthCheckResult(
                ok=status_code == expect_status,
                status_code=status_code,
                elapsed_ms=elapsed_ms,
                detail=body.strip(),
            )
    except urllib.error.HTTPError as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        detail = exc.read(256).decode("utf-8", errors="replace").strip()
        return HealthCheckResult(
            ok=False,
            status_code=int(exc.code),
            elapsed_ms=elapsed_ms,
            detail=detail or str(exc),
        )
    except (OSError, TimeoutError, urllib.error.URLError) as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return HealthCheckResult(
            ok=False,
            status_code=None,
            elapsed_ms=elapsed_ms,
            detail=f"{type(exc).__name__}: {exc}",
        )


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


def build_alert_text(
    *, service_name: str, health_url: str, result: HealthCheckResult
) -> str:
    status = result.status_code if result.status_code is not None else "unreachable"
    detail = result.detail[:500] if result.detail else "no response body"
    return (
        f":rotating_light: {service_name} health check failed\n"
        f"URL: {health_url}\n"
        f"Status: {status}\n"
        f"Latency: {result.elapsed_ms}ms\n"
        f"Detail: {detail}"
    )


def _env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"missing required env var {name}")
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=os.getenv("SILVERKEY_HEALTH_URL", "").strip())
    parser.add_argument(
        "--service-name", default=os.getenv("SILVERKEY_SERVICE_NAME", "SilverKey")
    )
    parser.add_argument("--expect-status", type=int, default=200)
    parser.add_argument("--timeout-seconds", type=float, default=10)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.url:
        sys.stderr.write("check_health_alert: pass --url or set SILVERKEY_HEALTH_URL\n")
        return 2

    result = check_health(
        args.url,
        timeout_seconds=args.timeout_seconds,
        expect_status=args.expect_status,
    )
    if result.ok:
        sys.stdout.write(
            f"check_health_alert: OK {args.url} "
            f"status={result.status_code} elapsed_ms={result.elapsed_ms}\n"
        )
        return 0

    text = build_alert_text(
        service_name=args.service_name, health_url=args.url, result=result
    )
    if args.dry_run:
        sys.stdout.write(text + "\n")
        return 1

    try:
        webhook_url = _env("SLACK_ALERTS_WEBHOOK_URL")
        post_slack_alert(webhook_url, text=text)
    except Exception as exc:
        sys.stderr.write(f"check_health_alert: Slack alert failed: {exc}\n")
        return 3
    sys.stderr.write("check_health_alert: health failed; Slack alert sent\n")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
