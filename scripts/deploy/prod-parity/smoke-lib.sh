#!/usr/bin/env bash
# Shared prod-parity smoke helpers for local make prod-parity-smoke and CI docker mode.
set -euo pipefail

SMOKE_LOG_PREFIX="${SMOKE_LOG_PREFIX:-prod-parity-smoke}"
BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"
BASE_URL="${BASE_URL%/}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-90}"
CURL_OPTS=(--fail --silent --show-error --max-time 30)

smoke_fail() {
  echo "${SMOKE_LOG_PREFIX}: $*" >&2
  exit 1
}

smoke_compose() {
  if declare -f compose >/dev/null 2>&1; then
    compose "$@"
  else
    smoke_fail "compose function not defined — source smoke-lib from a script that defines compose()"
  fi
}

smoke_wait_for_app_healthy() {
  local cid waited=0 status health
  cid="$(smoke_compose ps -q app)"
  if [[ -z "$cid" ]]; then
    smoke_compose logs app --tail 40 >&2 || true
    smoke_fail "app container not found after compose up"
  fi

  while (( waited < HEALTH_TIMEOUT_SEC )); do
    status="$(docker inspect --format='{{.State.Status}}' "$cid" 2>/dev/null || echo missing)"
    if [[ "$status" == "exited" || "$status" == "dead" ]]; then
      smoke_compose logs app --tail 40 >&2 || true
      smoke_fail "app container exited during startup (status: ${status})"
    fi
    health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo missing)"
    if [[ "$health" == "healthy" ]]; then
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
  done

  smoke_compose logs app --tail 40 >&2 || true
  smoke_fail "app health check timed out after ${HEALTH_TIMEOUT_SEC}s"
}

smoke_curl_http_200() {
  local path="$1"
  local code
  code="$(curl "${CURL_OPTS[@]}" -o /dev/null -w '%{http_code}' "${BASE_URL}${path}" || true)"
  if [[ "$code" != "200" ]]; then
    smoke_fail "GET ${BASE_URL}${path} returned HTTP ${code} (expected 200)"
  fi
  echo "${SMOKE_LOG_PREFIX}: OK ${BASE_URL}${path} (HTTP 200)"
}

smoke_assert_readyz() {
  local ready_body ready_code
  ready_body="$(mktemp)"
  trap 'rm -f "$ready_body"' RETURN
  ready_code="$(curl "${CURL_OPTS[@]}" -o "$ready_body" -w '%{http_code}' "${BASE_URL}/readyz" || true)"
  if [[ "$ready_code" != "200" ]]; then
    head -c 500 "$ready_body" >&2 || true
    smoke_fail "GET ${BASE_URL}/readyz returned HTTP ${ready_code} (expected 200)"
  fi
  if ! grep -q '"database"[[:space:]]*:[[:space:]]*"connected"' "$ready_body"; then
    head -c 500 "$ready_body" >&2 || true
    smoke_fail "/readyz JSON missing database:connected"
  fi
  if ! grep -q '"status"[[:space:]]*:[[:space:]]*"ok"' "$ready_body"; then
    head -c 500 "$ready_body" >&2 || true
    smoke_fail "/readyz JSON missing status:ok"
  fi
  echo "${SMOKE_LOG_PREFIX}: OK ${BASE_URL}/readyz (database connected)"
}
