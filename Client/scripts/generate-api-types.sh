#!/usr/bin/env bash
set -euo pipefail

# Generate TypeScript types from OpenAPI spec
npx openapi-typescript ../openapi/openapi.yaml -o packages/types/api.generated.ts

echo "✅ API types generated at packages/types/api.generated.ts"
echo "🚨 DO NOT EDIT api.generated.ts MANUALLY - it will be overwritten"
