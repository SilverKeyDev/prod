"""GitHub Actions–friendly logging (workflow commands + non-zero exit)."""

from __future__ import annotations

import os
import sys
from pathlib import Path


def is_github_actions() -> bool:
    return os.getenv("GITHUB_ACTIONS", "").lower() == "true"


def _escape_workflow_command(value: str) -> str:
    return (
        value.replace("%", "%25")
        .replace("\r", "%0D")
        .replace("\n", "%0A")
        .replace("\r\n", "%0D%0A")
    )


def log_notice(message: str) -> None:
    line = f"sync_inventory_posthog: {message}"
    sys.stdout.write(f"{line}\n")
    sys.stdout.flush()
    if is_github_actions():
        sys.stdout.write(f"::notice::{_escape_workflow_command(line)}\n")
        sys.stdout.flush()


def log_error(message: str, *, hint: str | None = None) -> None:
    """Write errors to stderr and emit a GitHub Actions ::error:: annotation."""
    lines = [f"sync_inventory_posthog: ERROR: {message}"]
    if hint:
        lines.append(f"sync_inventory_posthog: HINT: {hint}")
    block = "\n".join(lines)
    sys.stderr.write(f"{block}\n")
    sys.stderr.flush()
    if is_github_actions():
        annotation = message if not hint else f"{message} — {hint}"
        sys.stderr.write(f"::error::{_escape_workflow_command(annotation)}\n")
        sys.stderr.flush()
        _write_failure_job_summary(message, hint)


def fail(message: str, *, hint: str | None = None, exit_code: int = 1) -> None:
    log_error(message, hint=hint)
    raise SystemExit(exit_code)


def _write_failure_job_summary(message: str, hint: str | None) -> None:
    summary_path = (os.getenv("GITHUB_STEP_SUMMARY") or "").strip()
    if not summary_path:
        return
    body = [
        "## PostHog endpoint sync — failed",
        "",
        f"**Error:** {message}",
        "",
    ]
    if hint:
        body.extend(["**Hint:**", "", hint, ""])
    body.append("Fix secrets or PostHog keys and re-run the workflow.")
    Path(summary_path).write_text("\n".join(body) + "\n", encoding="utf-8")
