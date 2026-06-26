#!/usr/bin/env bash
# Full prod-parity Docker does-it-run smoke with CI env stubs (no AWS).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CI_COMPOSE="$ROOT/scripts/deploy/prod-parity/docker-compose.ci.yml"
SKIP_BUILD="${SKIP_BUILD:-0}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-120}"
BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"
COMPOSE_PROJECT_NAME="${DOES_IT_RUN_DOCKER_PROJECT:-silverkey-does-it-run-docker}"

export DOES_IT_RUN_ENV_DIR="${DOES_IT_RUN_ENV_DIR:-$(mktemp -d)}"
DOES_IT_RUN_DB_MODE=docker bash "$ROOT/scripts/ci/generate-does-it-run-env.sh"

export CLIENT_ENV_FILE="$DOES_IT_RUN_ENV_DIR/client.env"
export SERVER_ENV_FILE="$DOES_IT_RUN_ENV_DIR/server.env"
export DOES_IT_RUN_CLIENT_ENV="$CLIENT_ENV_FILE"
export DOES_IT_RUN_SERVER_ENV="$SERVER_ENV_FILE"
export COMPOSE_FILE_EXTRA="$CI_COMPOSE"
export COMPOSE_PROJECT_NAME

SERVER_ENV_FOR_COMPOSE="$ROOT/Server/.env"
SERVER_ENV_COPIED=false
if [[ ! -f "$SERVER_ENV_FOR_COMPOSE" ]]; then
  cp "$SERVER_ENV_FILE" "$SERVER_ENV_FOR_COMPOSE"
  SERVER_ENV_COPIED=true
fi

set -a
# shellcheck disable=SC1090
source "$CLIENT_ENV_FILE"
set +a
node "$ROOT/Client/scripts/assert-bundle-secrets.mjs" "$ROOT/Client"

compose() {
  bash "$ROOT/scripts/deploy/prod-parity/compose.sh" "$@"
}

cleanup() {
  if [[ "$SERVER_ENV_COPIED" == true ]]; then
    rm -f "$SERVER_ENV_FOR_COMPOSE"
  fi
  compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

# shellcheck source=scripts/deploy/prod-parity/smoke-lib.sh
source "$ROOT/scripts/deploy/prod-parity/smoke-lib.sh"
SMOKE_LOG_PREFIX="does-it-run-docker"

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "does-it-run-docker: building images..."
  compose build
else
  echo "does-it-run-docker: SKIP_BUILD=1 — skipping docker compose build"
fi

echo "does-it-run-docker: starting stack (detached)..."
compose up -d

echo "does-it-run-docker: waiting for app health (up to ${HEALTH_TIMEOUT_SEC}s)..."
smoke_wait_for_app_healthy

smoke_curl_http_200 "/livez"
smoke_assert_readyz

echo "does-it-run-docker: all checks passed"
