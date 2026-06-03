#!/usr/bin/env bash
# Purpose:  Verify relative markdown link targets exist under scanned documentation files.
# Called by: make check-docs; .github/workflows/doc-check.yml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

errors=0
scanned=0

scan_files=(
  documentation
  AGENTS.md
  README.md
  ARCHITECTURE.md
  setup.md
  Client/README.md
  Client/ARCHITECTURE.md
  Server/README.md
  Server/ARCHITECTURE.md
)

resolve_link() {
  local source_dir="$1"
  local target="$2"
  local resolved dir base

  target="${target%%#*}"
  if [[ -z "$target" ]]; then
    return 0
  fi
  if [[ "$target" =~ ^(https?://|mailto:|tel:) ]]; then
    return 0
  fi
  # Only validate markdown doc links (code path refs use backticks or bare paths in prose)
  if [[ "$target" != *.md ]] && [[ "$target" != *.mdc ]]; then
    return 0
  fi

  if [[ "$target" == /* ]]; then
    resolved="$ROOT$target"
  else
    dir="$(cd "$source_dir" && pwd)"
    base="$(basename "$target")"
    if [[ "$target" == */* ]]; then
      resolved="$(cd "$dir/$(dirname "$target")" 2>/dev/null && pwd)/$base" || return 1
    else
      resolved="$dir/$base"
    fi
  fi

  if [[ -f "$resolved" ]] || [[ -d "$resolved" ]]; then
    return 0
  fi
  return 1
}

check_file() {
  local file="$1"
  local dir link
  dir="$(dirname "$file")"
  scanned=$((scanned + 1))

  while IFS= read -r link; do
    link="${link#*(}"
    link="${link%)*}"
    if ! resolve_link "$dir" "$link"; then
      echo "::error::Broken link in ${file#$ROOT/}: $link"
      errors=$((errors + 1))
    fi
  done < <(grep -oE '\]\([^)]+\)' "$file" 2>/dev/null | sort -u || true)
}

for entry in "${scan_files[@]}"; do
  if [[ -f "$entry" ]]; then
    check_file "$ROOT/$entry"
  elif [[ -d "$entry" ]]; then
    while IFS= read -r -d '' md; do
      check_file "$md"
    done < <(find "$entry" -name '*.md' -print0)
  fi
done

if [[ "$errors" -gt 0 ]]; then
  echo "check-doc-links: FAILED ($errors broken link(s) in $scanned file(s))"
  exit 1
fi

echo "check-doc-links: OK ($scanned file(s) scanned)"
