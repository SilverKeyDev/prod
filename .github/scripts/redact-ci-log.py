#!/usr/bin/env python3
"""Filter CI/deploy log lines — redact secrets; optional --highlights for error tracing."""

from __future__ import annotations

import argparse
import re
import sys

ERROR_HIGHLIGHT = re.compile(
    r"(?i)"
    r"(traceback\s*\(|"
    r"exception|"
    r"\berror\b|"
    r"critical|"
    r"fatal|"
    r"failed|"
    r"failure|"
    r"refused|"
    r"timeout|"
    r"denied|"
    r"operationalerror|"
    r"importerror|"
    r"modulenotfound|"
    r"assertionerror|"
    r"oomkilled|"
    r"cannot connect|"
    r"connection refused|"
    r"health check|"
    r"exit code|"
    r"errno\s)"
)

REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?-----END[A-Z ]*PRIVATE KEY-----",
            re.MULTILINE,
        ),
        "[REDACTED_PRIVATE_KEY]",
    ),
    (re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"), "[REDACTED_JWT]"),
    (re.compile(r"phc_[A-Za-z0-9]+"), "[REDACTED_POSTHOG]"),
    (re.compile(r"sk_(live|test)_[A-Za-z0-9]+"), "[REDACTED_STRIPE]"),
    (re.compile(r"postgresql(?:\+[A-Za-z0-9]+)?://[^\s'\"]+", re.I), "[REDACTED_DATABASE_URL]"),
    (re.compile(r"mysql://[^\s'\"]+", re.I), "[REDACTED_DATABASE_URL]"),
    (re.compile(r"redis://[^\s'\"@]+@[^\s'\"]+", re.I), "[REDACTED_REDIS_URL]"),
    (
        re.compile(r"(?i)(--build-arg\s+)([A-Za-z0-9_]+)='[^']*'"),
        r"\1\2='[REDACTED]'",
    ),
    (
        re.compile(r"(?i)(--secret\s+id=[A-Za-z0-9_]+,env=[A-Za-z0-9_]+)(?:=\S+)?"),
        r"\1",
    ),
    (
        re.compile(
            r"(?i)\b([A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL|AUTHORIZATION))=([^\s'\"\\]+)"
        ),
        r"\1=[REDACTED]",
    ),
    (
        re.compile(
            r'(?i)("(?:password|token|key|secret|auth|credential|apiKey|api_key|private_key)"\s*:\s*")[^"]*"'
        ),
        r'\1[REDACTED]"',
    ),
    (
        re.compile(
            r"(?i)\b(password|api[_-]?key|private[_-]?key|credential)\s*[:=]\s*['\"]?[^\s'\"]{8,}"
        ),
        r"\1=[REDACTED]",
    ),
    (
        re.compile(
            r"(?i)\b(secret|token)\s*=\s*['\"]?[^\s'\"]{8,}"
        ),
        r"\1=[REDACTED]",
    ),
    (re.compile(r"(?i)Bearer\s+[A-Za-z0-9\-._~+/]+=*"), "Bearer [REDACTED]"),
]

HIGHLIGHT_MAX_LINES = 80


def redact(text: str) -> str:
    for pattern, repl in REPLACEMENTS:
        text = pattern.sub(repl, text)
    return text


def error_highlights(text: str, *, max_lines: int = HIGHLIGHT_MAX_LINES) -> str:
    """Return redacted lines that look like failures — for quick CI triage."""
    redacted = redact(text)
    lines = [line for line in redacted.splitlines() if ERROR_HIGHLIGHT.search(line)]
    if not lines:
        return "(no error-keyword lines matched — see log tail below)\n"
    if len(lines) > max_lines:
        lines = lines[-max_lines:]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Redact secrets from CI/deploy log text.")
    parser.add_argument(
        "--highlights",
        action="store_true",
        help="Emit only redacted error/traceback lines (fast triage).",
    )
    parser.add_argument(
        "--max-lines",
        type=int,
        default=HIGHLIGHT_MAX_LINES,
        help="Max highlight lines when using --highlights.",
    )
    args = parser.parse_args()
    raw = sys.stdin.read()
    if args.highlights:
        sys.stdout.write(error_highlights(raw, max_lines=args.max_lines))
    else:
        sys.stdout.write(redact(raw))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
