#!/usr/bin/env bash
# Client lint entry: auto-runs every scripts/lint.d/*.sh (sorted by path), then pnpm check.
# Add a new linter: add scripts/lint.d/20_name.sh and chmod +x (use numeric prefixes for order).
# Auto-fix runs in scripts/run-all-linters.sh (fix:quiet) before this script; only failures are printed here.
set -euo pipefail

CLIENT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$CLIENT_ROOT"

# Run a command with stdout/stderr captured; print output only on non-zero exit.
run_step() {
  local log
  log="$(mktemp)"
  if ! "$@" >"$log" 2>&1; then
    cat "$log" >&2
    rm -f "$log"
    return 1
  fi
  rm -f "$log"
  return 0
}

shopt -s nullglob
for f in scripts/lint.d/*.sh; do
  if [[ -x "$f" ]]; then
    run_step "$f" || exit 1
  elif [[ -f "$f" ]]; then
    echo "Client lint: skipping non-executable $f (chmod +x to enable)" >&2
  fi
done
shopt -u nullglob

# Check phase: stream warnings/errors (do not capture — eslint may exit 0 with warnings).
pnpm run check
