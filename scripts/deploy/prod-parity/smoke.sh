#!/usr/bin/env bash
# Build (optional), boot prod-parity compose detached, wait for /livez + /readyz, tear down.
# Usage (repo root): make prod-parity-smoke
#   SKIP_BUILD=1 make prod-parity-smoke   # reuse existing image
#   HEALTH_TIMEOUT_SEC=120 make prod-parity-smoke
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CLIENT_ENV="$ROOT/Client/.env"
SERVER_ENV="$ROOT/Server/.env"

SKIP_BUILD="${SKIP_BUILD:-0}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-90}"
BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"

compose() {
  bash "$ROOT/scripts/deploy/prod-parity/compose.sh" "$@"
}

cleanup() {
  compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

# shellcheck source=scripts/deploy/prod-parity/smoke-lib.sh
source "$ROOT/scripts/deploy/prod-parity/smoke-lib.sh"

require_file() {
  local path="$1" hint="$2"
  if [[ ! -f "$path" ]]; then
    smoke_fail "${path} missing (${hint})"
  fi
}

require_file "$SERVER_ENV" "run make setup-dev"
require_file "$CLIENT_ENV" "run make secrets or copy Client/.env.example"

set -a
# shellcheck disable=SC1090
source "$CLIENT_ENV"
set +a
node "$ROOT/Client/scripts/assert-bundle-secrets.mjs" "$ROOT/Client"

echo "prod-parity-smoke: using all Client/.env entries as Docker build args"

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "prod-parity-smoke: building images..."
  compose build
else
  echo "prod-parity-smoke: SKIP_BUILD=1 — skipping docker compose build"
fi

echo "prod-parity-smoke: starting stack (detached)..."
compose up -d

echo "prod-parity-smoke: waiting for app health (up to ${HEALTH_TIMEOUT_SEC}s)..."
smoke_wait_for_app_healthy

smoke_curl_http_200 "/livez"
smoke_assert_readyz

echo "prod-parity-smoke: all checks passed"
