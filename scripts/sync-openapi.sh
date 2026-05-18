#!/usr/bin/env bash
# Regenerate client/server types from openapi/, validate, and verify drift vs git HEAD.
# Mirrors .github/workflows/openapi-sync.yml for local use.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RUN_TESTS=1
if [[ "${1:-}" == "--no-tests" ]]; then
  RUN_TESTS=0
fi

echo "==> Bundle OpenAPI spec (openapi/openapi.yaml -> openapi.yaml)"
npm run openapi:bundle --silent

echo "==> Validate bundled spec"
npx swagger-cli validate openapi.yaml

echo "==> Regenerate server Pydantic models"
(
  cd Server
  bash scripts/generate-pydantic-models.sh
)

echo "==> Regenerate client TypeScript types"
(
  cd Client
  pnpm generate:api-types
)

echo "==> Check generated files match committed copies"
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
  exit 1
fi

if [[ "$RUN_TESTS" -eq 1 ]]; then
  echo "==> OpenAPI contract tests"
  if [[ -x Server/.venv/bin/python ]]; then
    (
      cd Server
      .venv/bin/python -m pytest tests/contract/test_openapi_contracts.py -q -o addopts=
    )
  else
    echo "⚠️  Skipping contract tests (Server/.venv not found)"
  fi

  echo "==> Client typecheck"
  (
    cd Client
    pnpm typecheck
  )
fi

echo ""
echo "✅ OpenAPI sync complete (spec, server schemas, client types, and checks)"
