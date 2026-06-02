#!/usr/bin/env bash
# Purpose:  Regenerate log contract artifacts and verify drift vs git HEAD.
# Called by: make log-contracts-verify
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "==> Generate log contracts"
python3 scripts/log_contracts/generate.py

GENERATED_PATHS=(
  scripts/log_contracts/categories.yaml
  Client/packages/logger/core/categories.generated.ts
  Client/packages/logger/core/categories.ts
  Client/packages/logger/config/loggerContract.generated.ts
  Client/packages/logger/config/adminLoggerKeys.generated.ts
  Server/logger/core/categories_generated.py
  Server/logger/core/categories.py
  Server/logger/config/logger_contract_generated.py
  Server/logger/config/config_model.py
  Server/logger/config/allowed_logger_config_keys_generated.py
)

echo "==> Check generated files match committed copies"
DRIFT=0
for SYNC_FILE in "${GENERATED_PATHS[@]}"; do
  if ! git diff --quiet -- "$SYNC_FILE"; then
    echo "❌ Out of sync: $SYNC_FILE"
    DRIFT=1
  else
    echo "✅ In sync: $SYNC_FILE"
  fi
done

if [[ "$DRIFT" -ne 0 ]]; then
  echo ""
  echo "Regeneration changed tracked files. Review the diff, then commit:"
  echo "  make log-contracts"
  exit 1
fi
