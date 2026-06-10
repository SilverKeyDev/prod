#!/usr/bin/env bash
# Purpose:  Correlate client and server logs for an unexpected logout using X-Request-ID.
# Called by: Manual — ops investigation only. Not wired to any Makefile target or CI workflow.
# Usage:    ./scripts/ops/correlate-auth-incident.sh <X-Request-ID>
#
# 1) From browser DevTools (Network): pick any API response around the event and copy the
#    X-Request-ID response header (echoed from the server; matches extra.request_id in logs).
# 2) From client logs: search for AUTH_ERROR_401 or "401 recovery refresh" and use
#    serverRequestId or clientRequestId or correlationId.
# 3) Search server logs (or CloudWatch Logs Insights) for that same string.
#
# Example (local files):
#   rg 'YOUR-ID-HERE' Server/var/log
#   rg 'YOUR-ID-HERE' path/to/frontend-log.txt
#
# Server log keys that include request_id: AUTH_REFRESH_COGNITO_FAILED, AUTH_REFRESH_MISSING_ACCESS_TOKEN,
# AUTH_TOKEN_DECODE_ERROR, INTERNAL_SERVER_ERROR, and many auth paths in app/__init__.py middleware.
#
# Client log messages: AUTH_ERROR_401 (packages/logger), "401 recovery refresh chain failed",
# Auth bootstrap start/complete/retry (packages/logger AUTH category), session verify/refresh in session.ts.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"
ID="${1:-}"
if [[ -z "$ID" ]]; then
  echo "Usage: $0 <X-Request-ID-from-response-or-logs>"
  exit 1
fi
echo "Repo root: $ROOT"
echo "Searching Client source for auth log tokens (documentation only)..."
if command -v rg >/dev/null 2>&1; then
  rg -n "AUTH_ERROR_401|AUTH_REFRESH_|Auth bootstrap|401 recovery" "$ROOT/Client/packages" \
    --glob '*.ts' --glob '*.tsx' 2>/dev/null | head -40 || true
else
  grep -RIn --include='*.ts' --include='*.tsx' -E "AUTH_ERROR_401|AUTH_REFRESH_|Auth bootstrap|401 recovery" \
    "$ROOT/Client/packages" 2>/dev/null | head -40 || true
fi
echo ""
echo "To search your captured logs, run:"
echo "  grep -R --fixed-strings '$ID' <logfile-or-directory>"
