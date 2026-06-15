#!/usr/bin/env bash
set -euo pipefail

QUIET="${OPENAPI_SYNC_QUIET:-0}"

# Generate TypeScript types from OpenAPI spec
if [[ "$QUIET" == "1" ]]; then
  npx openapi-typescript ../openapi/openapi.yaml -o packages/types/api.generated.ts >/dev/null 2>&1
else
  npx openapi-typescript ../openapi/openapi.yaml -o packages/types/api.generated.ts
  echo "✅ API types generated at packages/types/api.generated.ts"
  echo "🚨 DO NOT EDIT api.generated.ts MANUALLY - it will be overwritten"
fi
