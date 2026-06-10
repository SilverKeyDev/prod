#!/usr/bin/env bash
# Fail on stale repo-root scripts/*.sh paths after scripts/ reorganization (setup/, ci/, run/, …).
# Called by: make check-docs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ALLOWED_TOP_LEVEL=(
  print-automation-memory.sh
)

errors=0

is_allowed_top_level() {
  local base="$1"
  local name
  for name in "${ALLOWED_TOP_LEVEL[@]}"; do
    [[ "$base" == "$name" ]] && return 0
  done
  return 1
}

already_reported() {
  local key="$1"
  local log="${TMPDIR:-/tmp}/sk-script-ref-$$.log"
  touch "$log"
  if grep -Fxq "$key" "$log" 2>/dev/null; then
    return 0
  fi
  echo "$key" >>"$log"
  return 1
}

report_stale() {
  local ref="$1" file="$2"
  local key="${file}:${ref}"
  already_reported "$key" && return
  echo "check-script-references: stale flat path: $ref (in $file)" >&2
  echo "  Hint: use scripts/setup/, scripts/ci/, scripts/run/, or documentation/server/ops/scripts-guide.md" >&2
  errors=$((errors + 1))
}

scan_dirs=(
  documentation
  setup.md
  AGENTS.md
  CODEX.md
  README.md
  ARCHITECTURE.md
  .cursor/rules
  .github/workflows
  scripts/ci/README.md
)

log_file="${TMPDIR:-/tmp}/sk-script-ref-$$.log"
: >"$log_file"
trap 'rm -f "$log_file"' EXIT

while IFS= read -r -d '' file; do
  rel_file="${file#"$ROOT"/}"
  while IFS= read -r ref; do
    [[ -n "$ref" ]] || continue
    base="${ref#scripts/}"
    if is_allowed_top_level "$base"; then
      if [[ ! -f "$ROOT/$ref" ]]; then
        key="${rel_file}:${ref}:missing"
        if ! already_reported "$key"; then
          echo "check-script-references: missing allowlisted script: $ref (in $rel_file)" >&2
          errors=$((errors + 1))
        fi
      fi
      continue
    fi
    if [[ -f "$ROOT/$ref" ]]; then
      key="${rel_file}:${ref}:flat-on-disk"
      if ! already_reported "$key"; then
        echo "check-script-references: flat script still on disk (belongs under scripts/setup|ci|run|…): $ref (in $rel_file)" >&2
        errors=$((errors + 1))
      fi
      continue
    fi
    report_stale "$ref" "$rel_file"
  done < <(
    grep -oE '(^|[ (])\.?/?scripts/[A-Za-z0-9_.-]+\.sh|scripts/[A-Za-z0-9_.-]+\.sh' "$file" 2>/dev/null \
      | sed -E 's/^[^/]*\.?\.?\///;s/^\.\///' \
      | grep -E '^scripts/[^/]+\.sh$' \
      | sort -u || true
  )
done < <(
  find "${scan_dirs[@]}" -type f \( -name '*.md' -o -name '*.mdc' -o -name '*.yml' -o -name '*.yaml' \) -print0 2>/dev/null
)

if [[ $errors -gt 0 ]]; then
  echo "check-script-references: FAILED ($errors issue(s))" >&2
  exit 1
fi

echo "check-script-references: OK"
