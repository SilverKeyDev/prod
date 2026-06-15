#!/usr/bin/env bash
# Purpose:  Lists call sites that use apiRequest (redirect-on-AuthenticationError) vs lower-level
#           httpClient/fetchJson (caller decides error handling). Useful for auditing auth surface.
# Called by: Manual — ops/audit only. Not wired to any Makefile target or CI workflow.
# Usage:    ./scripts/ops/list-auth-http-entrypoints.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"
cd "$ROOT"

HTTP_ROOTS=(Client/packages Client/apps/web Client/apps/mobile/app)

run_search() {
  local pattern="$1"
  if command -v rg >/dev/null 2>&1; then
    rg -n --glob '*.ts' --glob '*.tsx' --glob '!**/dist/**' "$pattern" "${HTTP_ROOTS[@]}" || true
  else
    echo "(tip: install ripgrep for faster search; using grep fallback)" >&2
    grep -RIn --include='*.ts' --include='*.tsx' \
      --exclude-dir=dist --exclude-dir=.expo --exclude-dir=Pods \
      -E "$pattern" "${HTTP_ROOTS[@]}" || true
  fi
}

echo "=== apiRequest / apiGet / apiPost / apiPut / apiPatch / apiDelete (compat layer) ==="
run_search '\bapi(Request|Get|Post|Put|Patch|Delete)\s*\('
echo ""
echo "=== fetchJson / fetchJsonWithRetry (httpClient; no apiRequest catch) ==="
run_search '\bfetchJson(WithRetry)?\s*\('
echo ""
echo "=== httpClient.request / httpRequest direct ==="
run_search 'httpClient\.(request|requestWithRetry)|\bhttpRequest\s*\('
echo ""
echo "Note: apiRequest wraps fetchJsonWithRetry and calls handleAuthenticationError on AuthenticationError."
echo "fetchJson/httpClient.request propagate AuthenticationError to the caller unless wrapped."
