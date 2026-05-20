#!/usr/bin/env bash
# Cursor MCP setup only (install tools, seed mcp.json, verify, print summary).
# Usage: ./scripts/setup-mcp.sh
#        MCP_NO_INSTALL=true ./scripts/setup-mcp.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/setup-mcp.sh
source "${ROOT}/scripts/lib/setup-mcp.sh"

setup_mcp_configure "$ROOT"
exit $?
