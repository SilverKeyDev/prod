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
CURL_OPTS=(--fail --silent --show-error --max-time 30)

compose() {
  bash "$ROOT/scripts/deploy/prod-parity/compose.sh" "$@"
}

cleanup() {
  compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

fail() {
  echo "prod-parity-smoke: $*" >&2
  exit 1
}

require_file() {
  local path="$1" hint="$2"
  if [[ ! -f "$path" ]]; then
    fail "${path} missing (${hint})"
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

wait_for_app_healthy() {
  local cid waited=0 status health
  cid="$(compose ps -q app)"
  if [[ -z "$cid" ]]; then
    compose logs app --tail 40 >&2 || true
    fail "app container not found after compose up"
  fi

  while (( waited < HEALTH_TIMEOUT_SEC )); do
    status="$(docker inspect --format='{{.State.Status}}' "$cid" 2>/dev/null || echo missing)"
    if [[ "$status" == "exited" || "$status" == "dead" ]]; then
      compose logs app --tail 40 >&2 || true
      fail "app container exited during startup (status: ${status})"
    fi
    health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo missing)"
    if [[ "$health" == "healthy" ]]; then
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
  done

  compose logs app --tail 40 >&2 || true
  fail "app health check timed out after ${HEALTH_TIMEOUT_SEC}s"
}

echo "prod-parity-smoke: waiting for app health (up to ${HEALTH_TIMEOUT_SEC}s)..."
wait_for_app_healthy

curl_http_200() {
  local path="$1"
  local code
  code="$(curl "${CURL_OPTS[@]}" -o /dev/null -w '%{http_code}' "${BASE_URL}${path}" || true)"
  if [[ "$code" != "200" ]]; then
    fail "GET ${BASE_URL}${path} returned HTTP ${code} (expected 200)"
  fi
  echo "prod-parity-smoke: OK ${BASE_URL}${path} (HTTP 200)"
}

curl_http_200 "/livez"

ready_body="$(mktemp)"
trap 'rm -f "$ready_body"; cleanup' EXIT
ready_code="$(curl "${CURL_OPTS[@]}" -o "$ready_body" -w '%{http_code}' "${BASE_URL}/readyz" || true)"
if [[ "$ready_code" != "200" ]]; then
  head -c 500 "$ready_body" >&2 || true
  fail "GET ${BASE_URL}/readyz returned HTTP ${ready_code} (expected 200)"
fi
if ! grep -q '"database"[[:space:]]*:[[:space:]]*"connected"' "$ready_body"; then
  head -c 500 "$ready_body" >&2 || true
  fail "/readyz JSON missing database:connected"
fi
if ! grep -q '"status"[[:space:]]*:[[:space:]]*"ok"' "$ready_body"; then
  head -c 500 "$ready_body" >&2 || true
  fail "/readyz JSON missing status:ok"
fi
echo "prod-parity-smoke: OK ${BASE_URL}/readyz (database connected)"

echo "prod-parity-smoke: all checks passed"
