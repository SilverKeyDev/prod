#!/usr/bin/env bash
# Run all linters for the given scope. Single entry point for CI and local use.
# Requires: Client — `cd Client && pnpm install`; Server — deps installed (e.g. venv +
# pip install -r Server/requirements/ci.txt for lint-only, or Server/requirements/runtime.txt for full app).
# Server: auto-discovers Server/scripts/lint/lint_*.py then lint/lint_*.sh (sorted per shell glob).
# Client: Client/scripts/run-client-linters.sh runs scripts/lint.d/*.sh (optional) then pnpm check.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

SCOPE="${1:-all}"

is_ci() {
  [ "${CI:-}" = "true" ]
}

run_client() {
  CLIENT_BIN="${REPO_ROOT}/Client/node_modules/.bin"
  if [ ! -d "$CLIENT_BIN" ]; then
    echo "==> Client: installing dependencies (pnpm install)..."
    (cd Client && pnpm install)
  fi
  export PATH="${CLIENT_BIN}:${PATH}"

  if is_ci; then
    echo "==> Client: CI mode detected; skipping auto-fix steps."
  else
    echo "==> Client: applying fixes (format, lint --fix)..."
    (cd Client && pnpm run fix) || true
  fi

  echo "==> Client: running Client/scripts/run-client-linters.sh (discovered lint.d/*.sh + pnpm check)..."
  (cd Client && bash scripts/run-client-linters.sh)
}

run_server() {
  # Prefer Server venv so lint_*.py scripts can import app (flask, etc.)
  SERVER_PYTHON="python3"
  if [ -x "${REPO_ROOT}/Server/.venv/bin/python3" ]; then
    SERVER_PYTHON="${REPO_ROOT}/Server/.venv/bin/python3"
  elif [ -x "${REPO_ROOT}/Server/venv/bin/python3" ]; then
    SERVER_PYTHON="${REPO_ROOT}/Server/venv/bin/python3"
  fi

  if is_ci; then
    echo "==> Server: CI mode detected; skipping auto-fix steps."
  else
    echo "==> Server: applying fixes (ruff check --fix, ruff format)..."
    if (cd "${REPO_ROOT}/Server" && "$SERVER_PYTHON" -m ruff --version >/dev/null 2>&1); then
      (cd "${REPO_ROOT}/Server" && "$SERVER_PYTHON" -m ruff check . --fix && "$SERVER_PYTHON" -m ruff format .)
    elif command -v ruff >/dev/null 2>&1; then
      (cd "${REPO_ROOT}/Server" && ruff check . --fix && ruff format .)
    else
      echo "==> Server: ruff not found (try: cd Server && source .venv/bin/activate && pip install ruff); skipping auto-fix." >&2
    fi
  fi

  echo "==> Server: running discovered linters (scripts/lint/lint_*.py, then lint_*.sh)…"
  (
    cd "$REPO_ROOT"
    shopt -s nullglob
    for f in Server/scripts/lint/lint_*.py; do
      echo "  Running $f"
      "$SERVER_PYTHON" "$f" || exit 1
    done
    for f in Server/scripts/lint/lint_*.sh; do
      if [ ! -x "$f" ]; then
        echo "  Skipping non-executable: $f (chmod +x to enable)" >&2
        continue
      fi
      echo "  Running $f"
      bash "$f" || exit 1
    done
    shopt -u nullglob
  )
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
    echo "  client - run all Client linters (lint.d/*.sh + pnpm check)" >&2
    echo "  server - run all Server linters (lint_*.py + lint_*.sh under Server/scripts/lint/)" >&2
    echo "  all    - run both (default)" >&2
    exit 1
    ;;
esac

echo "==> Lint passed for scope: $SCOPE"
