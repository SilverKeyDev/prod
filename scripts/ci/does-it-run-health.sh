#!/usr/bin/env bash
# Shared HTTP health assertions for does-it-run backend smoke.
# Requires: BASE_URL, optional SMOKE_LOG_PREFIX (default does-it-run-health)
set -euo pipefail

SMOKE_LOG_PREFIX="${SMOKE_LOG_PREFIX:-does-it-run-health}"
BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"
BASE_URL="${BASE_URL%/}"
CURL_OPTS=(--fail --silent --show-error --max-time 30)

smoke_fail() {
  echo "${SMOKE_LOG_PREFIX}: $*" >&2
  exit 1
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
