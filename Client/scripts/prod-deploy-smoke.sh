#!/usr/bin/env bash
# Post-deploy smoke: public liveness + Maps script JSON (runtime GOOGLE_MAPS_API_KEY path).
# Usage: PROD_BASE_URL=https://usesilverkey.com bash Client/scripts/prod-deploy-smoke.sh
set -euo pipefail

BASE="${PROD_BASE_URL:-https://usesilverkey.com}"
BASE="${BASE%/}"
CURL_OPTS=(--fail --silent --show-error --retry 3 --retry-delay 2 --max-time 30)

echo "prod-deploy-smoke: base URL ${BASE}"

code_livez="$(curl "${CURL_OPTS[@]}" -o /dev/null -w '%{http_code}' "${BASE}/livez" || true)"
if [[ "$code_livez" != "200" ]]; then
  echo "::error::GET ${BASE}/livez returned HTTP ${code_livez} (expected 200)" >&2
  exit 1
fi
echo "prod-deploy-smoke: OK ${BASE}/livez (HTTP 200)"

code_healthz="$(curl "${CURL_OPTS[@]}" -o /dev/null -w '%{http_code}' "${BASE}/healthz" || true)"
if [[ "$code_healthz" != "200" ]]; then
  echo "::error::GET ${BASE}/healthz returned HTTP ${code_healthz} (expected 200)" >&2
  exit 1
fi
echo "prod-deploy-smoke: OK ${BASE}/healthz (HTTP 200)"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
code_maps="$(curl "${CURL_OPTS[@]}" -o "$tmp" -w '%{http_code}' \
  -H 'Accept: application/json' \
  "${BASE}/api/maps/script" || true)"

if [[ "$code_maps" != "200" ]]; then
  echo "::error::GET ${BASE}/api/maps/script returned HTTP ${code_maps} (expected 200)" >&2
  head -c 500 "$tmp" >&2 || true
  exit 1
fi

if ! grep -q '"success"[[:space:]]*:[[:space:]]*true' "$tmp"; then
  echo "::error::/api/maps/script JSON missing success:true" >&2
  head -c 500 "$tmp" >&2 || true
  exit 1
fi

if ! grep -q 'maps\.googleapis\.com' "$tmp"; then
  echo "::error::/api/maps/script JSON missing maps.googleapis.com in script_url" >&2
  head -c 500 "$tmp" >&2 || true
  exit 1
fi

echo "prod-deploy-smoke: OK ${BASE}/api/maps/script (JSON success + script_url host)"
echo "prod-deploy-smoke: all checks passed"
