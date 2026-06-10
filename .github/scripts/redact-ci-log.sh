#!/usr/bin/env bash
# redact-ci-log.sh — filter stdin before CI/deploy stdout; pass --highlights for error-only lines.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/redact-ci-log.py" "$@"
