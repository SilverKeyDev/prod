#!/usr/bin/env bash
# Discovered by scripts/ci/run-all-linters.sh (Server) via lint_*.sh glob.
set -euo pipefail
SERVER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SERVER_ROOT"
ruff check .
ruff format --check .
