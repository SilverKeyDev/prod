#!/usr/bin/env bash
# Scan local machine prerequisites for SilverKey development.
# Usage: ./scripts/setup/check-deps.sh [--no-install] [--skip-secrets]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/deps.sh
source "${ROOT}/scripts/lib/deps.sh"

deps_parse_flags "$@"

if ! deps_run_scan "$ROOT"; then
  exit 1
fi
