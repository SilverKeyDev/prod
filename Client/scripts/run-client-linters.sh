#!/usr/bin/env bash
# Client lint entry: auto-runs every scripts/lint.d/*.sh (sorted by path), then pnpm check.
# Add a new linter: add scripts/lint.d/20_name.sh and chmod +x (use numeric prefixes for order).
set -euo pipefail

CLIENT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$CLIENT_ROOT"

shopt -s nullglob
for f in scripts/lint.d/*.sh; do
  if [[ -x "$f" ]]; then
    echo "==> Client (discovered): $f"
    "$f"
  else
    echo "==> Client (discovered, skipping — not executable): $f" >&2
  fi
done
shopt -u nullglob

echo "==> Client: pnpm check (typecheck, lint, format, cycles, audit, build)"
pnpm run check
