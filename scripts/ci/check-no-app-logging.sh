#!/usr/bin/env bash
# Fail if legacy app_logging module is still referenced under Server/.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"

if ! command -v rg >/dev/null 2>&1; then
  echo "check-no-app-logging: ripgrep (rg) required" >&2
  exit 1
fi

if rg -n 'app\.utils\.security\.app_logging|from app_logging' "$ROOT/Server" \
  --glob '*.py' \
  --glob '!Server/app/utils/security/app_logging.py' 2>/dev/null; then
  echo "Legacy app_logging imports found; migrate to \`from logger import log\`." >&2
  exit 1
fi

echo "OK: no app_logging imports under Server"
