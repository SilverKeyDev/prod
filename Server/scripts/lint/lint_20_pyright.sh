#!/usr/bin/env bash
# Discovered by scripts/ci/run-all-linters.sh (Server) via lint_*.sh glob.
set -euo pipefail
SERVER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SERVER_ROOT"
if ! command -v pyright >/dev/null 2>&1; then
  if [ "${CI:-}" = "true" ]; then
    echo "==> Server: pyright required on PATH in CI (pip install pyright)" >&2
    exit 1
  fi
  echo "==> Server: pyright not on PATH; skipping (install with: pip install pyright)" >&2
  exit 0
fi
pyright
