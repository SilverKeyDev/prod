#!/usr/bin/env bash
# Fail when macOS/iCloud/Finder conflict copies exist (e.g. "file 2.py" beside "file.py").
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PRUNE=(
  -path "$ROOT/.git"
  -o -path "$ROOT/node_modules"
  -o -path "$ROOT/Client/node_modules"
  -o -path "$ROOT/Client/dist"
  -o -path "$ROOT/Client/.expo"
  -o -path "$ROOT/Server/.venv"
  -o -path "$ROOT/Server/.venv-ci"
  -o -path "$ROOT/Server/coverage"
  -o -path "$ROOT/coverage"
)

duplicates=()
while IFS= read -r path; do
  [[ -n "$path" ]] && duplicates+=("$path")
done < <(
  find "$ROOT" \( "${PRUNE[@]}" \) -prune -o -type f \( -name '* [0-9]' -o -name '* [0-9].*' \) -print 2>/dev/null \
    | sort
)

if ((${#duplicates[@]} == 0)); then
  echo "check-macos-duplicate-files: OK"
  exit 0
fi

echo "check-macos-duplicate-files: FAILED (${#duplicates[@]} macOS duplicate copy/copies)"
echo ""
echo "These look like iCloud/Finder conflict names (space + number before extension)."
echo "Delete the numbered copies and keep the canonical file without the suffix."
echo ""
for path in "${duplicates[@]}"; do
  rel="${path#"$ROOT"/}"
  echo "  - $rel"
done
echo ""
echo "If the repo lives on an iCloud-synced Desktop/Documents folder, move it to ~/Developer"
echo "or disable iCloud for that directory to stop recurrence. See setup.md."
exit 1
