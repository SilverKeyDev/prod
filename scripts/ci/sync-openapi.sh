#!/usr/bin/env bash
# Purpose:  Regenerate client/server types from openapi/, validate, and verify drift vs git HEAD.
# Called by: make openapi-verify; make openapi-verify-pre-push; pre-commit openapi-drift hook
# Flags: --quiet (pre-commit) suppresses bundle/codegen noise; --advisory never fails on drift.
# Mirrors .github/workflows/openapi-sync.yml for local use.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

RUN_TESTS=1
SKIP_CONTRACT_TESTS=0
QUIET=0
ADVISORY=0
for arg in "$@"; do
  case "$arg" in
    --no-tests) RUN_TESTS=0 ;;
    --skip-contract-tests) SKIP_CONTRACT_TESTS=1 ;;
    --quiet) QUIET=1 ;;
    --advisory) ADVISORY=1 ;;
  esac
done

if [[ "$QUIET" -eq 1 ]]; then
  export OPENAPI_SYNC_QUIET=1
  export REDOCLY_SUPPRESS_UPDATE_NOTICE=true
fi

# Run a command; in quiet mode hide success output but replay it on failure.
run_openapi_step() {
  local label="$1"
  shift
  if [[ "$QUIET" -eq 1 ]]; then
    if ! "$@" >/dev/null 2>&1; then
      echo "❌ OpenAPI sync failed: $label" >&2
      "$@" >&2
      exit 1
    fi
  else
    echo "==> $label"
    "$@"
  fi
}

run_openapi_step "Bundle OpenAPI spec (openapi/openapi.yaml -> openapi.yaml)" \
  npm run openapi:bundle --silent

run_openapi_step "Validate bundled spec" npx swagger-cli validate openapi.yaml

run_openapi_step "Regenerate server Pydantic models" bash -c 'cd Server && bash scripts/generate-pydantic-models.sh'

run_openapi_step "Regenerate client TypeScript types" bash -c 'cd Client && pnpm generate:api-types'

if [[ "$QUIET" -eq 0 ]]; then
  echo "==> Check generated files match committed copies"
fi
DRIFT=0
for SYNC_FILE in Client/packages/types/api.generated.ts Server/app/schemas/generated.py; do
  if ! git diff --quiet -- "$SYNC_FILE"; then
    echo "❌ Out of sync: $SYNC_FILE"
    DRIFT=1
  else
    echo "✅ In sync: $SYNC_FILE"
  fi
done

if [[ "$DRIFT" -ne 0 ]]; then
  echo ""
  echo "Regeneration changed tracked files. Review the diff, then commit:"
  echo "  git add Client/packages/types/api.generated.ts Server/app/schemas/generated.py"
  if [[ "$ADVISORY" -eq 1 ]]; then
    exit 0
  fi
  exit 1
fi

if [[ "$RUN_TESTS" -eq 1 ]]; then
  if [[ "$SKIP_CONTRACT_TESTS" -eq 0 ]]; then
    echo "==> OpenAPI contract tests"
    if [[ -x Server/.venv/bin/python ]]; then
      (
        cd Server
        .venv/bin/python -m pytest tests/contract/test_openapi_contracts.py -q -o addopts=
      )
    else
      echo "⚠️  Skipping contract tests (Server/.venv not found)"
    fi
  else
    echo "==> Skipping OpenAPI contract tests (full pytest will run them)"
  fi

  echo "==> Client typecheck"
  (
    cd Client
    pnpm typecheck
  )
fi

if [[ "$QUIET" -eq 0 ]]; then
  echo ""
  echo "✅ OpenAPI sync complete (spec, server schemas, client types, and checks)"
fi
