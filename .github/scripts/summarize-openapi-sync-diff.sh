#!/usr/bin/env bash
# Brief summary of drift in generated OpenAPI artifacts (for CI logs).
set -euo pipefail

file="${1:?usage: summarize-openapi-sync-diff.sh <path>}"
label="${2:-$file}"

if git diff --quiet -- "$file"; then
  echo "(no unstaged diff for $file)"
  exit 0
fi

echo "File: $label"
git diff --stat -- "$file" | sed 's/^/  /'

diff_lines=$(git diff -- "$file" | wc -l | tr -d ' ')
insertions=$(git diff --numstat -- "$file" | awk '{print $1}')
deletions=$(git diff --numstat -- "$file" | awk '{print $2}')

echo "  ~${insertions} insertions, ~${deletions} deletions (${diff_lines} diff lines)"

unified=$(git diff --unified=0 -- "$file")

paths=$(
  printf '%s\n' "$unified" | grep -E '^[-+].*"/api/' | grep -oE '"/api/[^"]+"' | tr -d '"' | sort -u || true
)
path_count=$(printf '%s\n' "$paths" | sed '/^$/d' | wc -l | tr -d ' ')

operations=$(
  printf '%s\n' "$unified" | grep -oE 'operations\["[^"]+"\]' | sort -u || true
)
op_count=$(printf '%s\n' "$operations" | sed '/^$/d' | wc -l | tr -d ' ')

if [ "$path_count" -gt 0 ]; then
  echo ""
  echo "API paths touched (${path_count}):"
  printf '%s\n' "$paths" | head -n 25 | sed 's/^/  /'
  if [ "$path_count" -gt 25 ]; then
    echo "  ... and $((path_count - 25)) more"
  fi
fi

if [ "$op_count" -gt 0 ]; then
  echo ""
  echo "Operations touched (${op_count}):"
  printf '%s\n' "$operations" | head -n 25 | sed 's/^/  /'
  if [ "$op_count" -gt 25 ]; then
    echo "  ... and $((op_count - 25)) more"
  fi
fi

if [ "$path_count" -eq 0 ] && [ "$op_count" -eq 0 ] && [ "$diff_lines" -gt 500 ]; then
  echo ""
  echo "Large diff with no discrete path/operation markers — likely full-file regeneration"
  echo "  (tooling/version drift, or openapi source changed broadly)."
fi
