#!/usr/bin/env bash
# pnpm audit uses npm registry endpoints that return 410 as of 2026-04-15 (pnpm/pnpm#11265).
# npm audit uses the bulk advisory API; we generate a temporary package-lock.json (gitignored) for it.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

cleanup() {
  rm -f package-lock.json
}
trap cleanup EXIT

npm install --package-lock-only --ignore-scripts --silent
npm audit --audit-level=critical
