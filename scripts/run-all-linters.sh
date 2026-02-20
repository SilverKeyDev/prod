#!/usr/bin/env bash
# Run all linters for the given scope. Single entry point for CI and local use.
# Requires: Client — `cd Client && pnpm install`; Server — deps installed (e.g. venv + pip install -r requirements.txt).
# New Server linters: add a file Server/scripts/lint_*.py (auto-discovered).
# New Client linters: add the script to the "check:all" target in Client/package.json.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

SCOPE="${1:-all}"

run_client() {
  CLIENT_BIN="${REPO_ROOT}/Client/node_modules/.bin"
  if [ ! -d "$CLIENT_BIN" ]; then
    echo "==> Client: installing dependencies (pnpm install)..."
    (cd Client && pnpm install)
  fi
  export PATH="${CLIENT_BIN}:${PATH}"

  echo "==> Client: applying fixes (format, lint --fix)..."
  (cd Client && pnpm run fix) || true

  echo "==> Client: running linters (typecheck, lint, format:check, cycles, parity, platform-imports, audit, build)..."
  (cd Client && pnpm run check)
}

run_server() {
  # Prefer Server venv so lint_*.py scripts can import app (flask, etc.)
  SERVER_PYTHON="python3"
  if [ -x "${REPO_ROOT}/Server/.venv/bin/python3" ]; then
    SERVER_PYTHON="${REPO_ROOT}/Server/.venv/bin/python3"
  elif [ -x "${REPO_ROOT}/Server/venv/bin/python3" ]; then
    SERVER_PYTHON="${REPO_ROOT}/Server/venv/bin/python3"
  fi

  echo "==> Server: applying fixes (ruff check --fix, ruff format)..."
  (cd Server && ruff check . --fix && ruff format .)

  echo "==> Server: running linters (lint_*.py, ruff check, ruff format --check, pyright)..."
  for f in Server/scripts/lint_*.py; do
    if [ -f "$f" ]; then
      echo "  Running $f"
      "$SERVER_PYTHON" "$f" || exit 1
    fi
  done
  (cd Server && ruff check . && ruff format --check .)
  if command -v pyright >/dev/null 2>&1; then
    (cd Server && pyright) || true
  fi
}

case "$SCOPE" in
  client)
    run_client
    ;;
  server)
    run_server
    ;;
  all)
    run_client
    run_server
    ;;
  *)
    echo "Usage: $0 [client|server|all]" >&2
    echo "  client - run all Client linters (via Client check:all)" >&2
    echo "  server - run all Server linters (ruff, pyright, every Server/scripts/lint_*.py)" >&2
    echo "  all    - run both (default)" >&2
    exit 1
    ;;
esac

echo "==> Lint passed for scope: $SCOPE"
