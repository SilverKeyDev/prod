#!/usr/bin/env bash
# Frontend does-it-run: Vite build + preview + HTTP 200 on /
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PREVIEW_HOST="${DOES_IT_RUN_PREVIEW_HOST:-localhost}"
PREVIEW_PORT="${DOES_IT_RUN_PREVIEW_PORT:-4173}"
PREVIEW_TIMEOUT_SEC="${DOES_IT_RUN_PREVIEW_TIMEOUT_SEC:-120}"

fail() {
  echo "does-it-run-frontend: $*" >&2
  exit 1
}

if [[ -z "${DOES_IT_RUN_CLIENT_ENV:-}" ]]; then
  export DOES_IT_RUN_ENV_DIR="${DOES_IT_RUN_ENV_DIR:-$(mktemp -d)}"
  DOES_IT_RUN_DB_MODE=lightweight bash "$ROOT/scripts/ci/generate-does-it-run-env.sh"
  export DOES_IT_RUN_CLIENT_ENV="$DOES_IT_RUN_ENV_DIR/client.env"
  export DOES_IT_RUN_SERVER_ENV="$DOES_IT_RUN_ENV_DIR/server.env"
fi

set -a
# shellcheck disable=SC1090
source "${DOES_IT_RUN_CLIENT_ENV}"
set +a

cd "$ROOT/Client"
echo "does-it-run-frontend: installing dependencies..."
pnpm install --frozen-lockfile

node "$ROOT/Client/scripts/assert-bundle-secrets.mjs" "$ROOT/Client"

echo "does-it-run-frontend: building web bundle..."
pnpm build:web

echo "does-it-run-frontend: verifying PostHog config in bundle..."
VERIFY_POSTHOG=1 NODE_ENV=production node scripts/verify-web-posthog-config.mjs

preview_pid=""
cleanup() {
  if [[ -n "$preview_pid" ]] && kill -0 "$preview_pid" 2>/dev/null; then
    kill "$preview_pid" 2>/dev/null || true
    wait "$preview_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "does-it-run-frontend: starting vite preview on ${PREVIEW_HOST}:${PREVIEW_PORT}..."
pnpm preview:web --host "$PREVIEW_HOST" --port "$PREVIEW_PORT" &
preview_pid=$!

sleep 3
preview_url="http://${PREVIEW_HOST}:${PREVIEW_PORT}/"
waited=0
while (( waited < PREVIEW_TIMEOUT_SEC )); do
  code="$(curl --silent --show-error --max-time 5 -o /dev/null -w '%{http_code}' "$preview_url" 2>/dev/null || true)"
  if [[ "$code" == "200" ]]; then
    echo "does-it-run-frontend: OK ${preview_url} (HTTP 200)"
    echo "does-it-run-frontend: all checks passed"
    exit 0
  fi
  if ! kill -0 "$preview_pid" 2>/dev/null; then
    fail "vite preview exited before responding"
  fi
  sleep 2
  waited=$((waited + 2))
done

fail "timed out waiting for ${preview_url} after ${PREVIEW_TIMEOUT_SEC}s"
