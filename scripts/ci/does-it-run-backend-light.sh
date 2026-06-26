#!/usr/bin/env bash
# Backend-light does-it-run: Postgres+Redis + Gunicorn + /livez + /readyz + /
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICES_COMPOSE="$ROOT/scripts/ci/does-it-run-services-compose.yml"
BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"
GUNICORN_TIMEOUT_SEC="${DOES_IT_RUN_GUNICORN_TIMEOUT_SEC:-180}"
COMPOSE_PROJECT_NAME="${DOES_IT_RUN_SERVICES_PROJECT:-silverkey-does-it-run-services}"

fail() {
  echo "does-it-run-backend-light: $*" >&2
  exit 1
}

services_compose() {
  docker compose -f "$SERVICES_COMPOSE" -p "$COMPOSE_PROJECT_NAME" "$@"
}

gunicorn_pid=""
cleanup() {
  if [[ -n "$gunicorn_pid" ]] && kill -0 "$gunicorn_pid" 2>/dev/null; then
    kill "$gunicorn_pid" 2>/dev/null || true
    wait "$gunicorn_pid" 2>/dev/null || true
  fi
  services_compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "does-it-run-backend-light: starting Postgres + Redis..."
services_compose up -d

wait_for_service_healthy() {
  local service="$1"
  local timeout_sec="${2:-90}"
  local waited=0
  while (( waited < timeout_sec )); do
    local cid health
    cid="$(services_compose ps -q "$service" 2>/dev/null || true)"
    if [[ -z "$cid" ]]; then
      services_compose logs "$service" --tail 30 >&2 || true
      fail "${service} container not found"
    fi
    health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo missing)"
    if [[ "$health" == "healthy" ]]; then
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
  done
  services_compose logs "$service" --tail 30 >&2 || true
  fail "${service} health check timed out after ${timeout_sec}s"
}

wait_for_service_healthy postgres 90
wait_for_service_healthy redis 60

export DOES_IT_RUN_ENV_DIR="${DOES_IT_RUN_ENV_DIR:-$(mktemp -d)}"
DOES_IT_RUN_DB_MODE=lightweight bash "$ROOT/scripts/ci/generate-does-it-run-env.sh"
export DOES_IT_RUN_CLIENT_ENV="$DOES_IT_RUN_ENV_DIR/client.env"
export DOES_IT_RUN_SERVER_ENV="$DOES_IT_RUN_ENV_DIR/server.env"

echo "does-it-run-backend-light: installing Python runtime dependencies..."
cd "$ROOT/Server"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip >/dev/null
# Install the CPU-only torch wheel first so the runtime.txt `torch==2.10.0` pin is already
# satisfied and pip does not pull the multi-GB CUDA build (matches bootstrap-venv.sh and
# Dockerfile.web). The version tracks the pin in requirements/runtime.txt.
pip install --no-cache-dir torch==2.10.0 --index-url https://download.pytorch.org/whl/cpu
pip install --no-cache-dir -r requirements/runtime.txt

echo "does-it-run-backend-light: building web bundle for SPA serving..."
cd "$ROOT/Client"
pnpm install --frozen-lockfile
set -a
# shellcheck disable=SC1090
source "${DOES_IT_RUN_CLIENT_ENV}"
set +a
pnpm build:web

echo "does-it-run-backend-light: starting Gunicorn (production mode)..."
cd "$ROOT/Server"
set -a
# shellcheck disable=SC1090
source "${DOES_IT_RUN_SERVER_ENV}"
set +a
unset TESTING
export FLASK_ENV=production
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
export CELERY_URL="${CELERY_URL:-$REDIS_URL}"
export WEB_CONCURRENCY=1
export GUNICORN_THREADS=2
export GUNICORN_BIND=127.0.0.1:5000

bash "$ROOT/Server/scripts/gunicorn-entrypoint.sh" &
gunicorn_pid=$!

# shellcheck source=scripts/ci/does-it-run-health.sh
source "$ROOT/scripts/ci/does-it-run-health.sh"
SMOKE_LOG_PREFIX="does-it-run-backend-light"

waited=0
while (( waited < GUNICORN_TIMEOUT_SEC )); do
  code="$(curl --silent --show-error --max-time 5 -o /dev/null -w '%{http_code}' "${BASE_URL}/livez" || true)"
  if [[ "$code" == "200" ]]; then
    break
  fi
  if ! kill -0 "$gunicorn_pid" 2>/dev/null; then
    fail "Gunicorn exited before /livez responded"
  fi
  sleep 2
  waited=$((waited + 2))
done

if (( waited >= GUNICORN_TIMEOUT_SEC )); then
  fail "timed out waiting for ${BASE_URL}/livez after ${GUNICORN_TIMEOUT_SEC}s"
fi

smoke_curl_http_200 "/livez"
smoke_assert_readyz
smoke_curl_http_200 "/"

echo "does-it-run-backend-light: all checks passed"
