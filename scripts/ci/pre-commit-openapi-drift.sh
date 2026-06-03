#!/usr/bin/env bash
# Regenerate OpenAPI-derived types when spec/generated paths change (advisory on commit).
# Skips contract tests and client typecheck — those run via make openapi-verify / CI.
set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="$(cd "$_HERE/../.." && pwd)"
exec bash "$ROOT/scripts/ci/sync-openapi.sh" --no-tests --skip-contract-tests --quiet --advisory
