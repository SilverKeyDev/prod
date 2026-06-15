#!/usr/bin/env bash
# Print automation memory seed (_core + persona) for pasting into Cursor Memory Notes.
# Usage: ./scripts/print-automation-memory.sh engineer-default
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEM_DIR="${ROOT}/.cursor/memory/automations"
PERSONA="${1:-}"

if [[ -z "$PERSONA" ]]; then
  echo "Usage: $0 <persona-name>" >&2
  echo "Personas (files in ${MEM_DIR}):" >&2
  find "$MEM_DIR" -maxdepth 1 -name '*.md' ! -name 'README.md' ! -name '_core.md' -exec basename {} .md \; | sort | sed 's/^/  - /' >&2
  exit 1
fi

CORE="${MEM_DIR}/_core.md"
PERSONA_FILE="${MEM_DIR}/${PERSONA}.md"

if [[ ! -f "$CORE" ]]; then
  echo "Missing ${CORE}" >&2
  exit 1
fi
if [[ ! -f "$PERSONA_FILE" ]]; then
  echo "Missing ${PERSONA_FILE}" >&2
  exit 1
fi

echo "--- Paste into Cursor: Automations → Tools → Memories → Manage ---"
echo ""
cat "$CORE"
echo ""
echo "---"
echo ""
cat "$PERSONA_FILE"
