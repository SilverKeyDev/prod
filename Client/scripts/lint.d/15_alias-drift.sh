#!/usr/bin/env bash
# Client: verify tsconfig packages/* paths stay aligned with Metro rewrites.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
echo "==> Client: audit-alias-tooling-drift"
node scripts/audit-alias-tooling-drift.mjs
echo "==> Client: bundler path manifest (--check)"
node scripts/generate-bundler-path-manifest.mjs --check
