#!/usr/bin/env bash
# Fail if Client code still imports the retired secureLogger module.
# Called by: scripts/ci/run-all-linters.sh (repo hygiene)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"

if ! command -v rg >/dev/null 2>&1; then
  echo "check-no-secure-logger: ripgrep (rg) required" >&2
  exit 1
fi

if rg -n 'services/security/secureLogger' "$ROOT/Client" --glob '*.{ts,tsx}' 2>/dev/null; then
  echo "secureLogger imports found in Client; use packages/logger instead." >&2
  exit 1
fi

echo "OK: no secureLogger imports in Client"
