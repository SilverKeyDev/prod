#!/usr/bin/env bash
# Advisory dead-code scan via vulture (unused functions/modules). Exits 0 unless VULTURE_STRICT=1.
set -euo pipefail
SERVER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SERVER_ROOT"

if ! command -v vulture >/dev/null 2>&1; then
  echo "vulture not installed; skip (pip install vulture or use requirements/lint.txt)"
  exit 0
fi

# Ignore tests, migrations, and generated schemas; 80% confidence reduces noise.
set +e
vulture app logger \
  --exclude "migrations,tests,app/schemas/generated.py" \
  --min-confidence 80
status=$?
set -e

if [[ "$status" -ne 0 ]]; then
  if [[ "${VULTURE_STRICT:-}" == "1" ]]; then
    echo "vulture reported unused code (set VULTURE_STRICT=0 to treat as advisory only)"
    exit "$status"
  fi
  echo "vulture: advisory findings above (not failing CI; set VULTURE_STRICT=1 to enforce)"
fi
exit 0
