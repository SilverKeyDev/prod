#!/usr/bin/env bash
# Purpose:  Fail if repo-root docs/ exists or long-form markdown lives outside allowed paths.
# Called by: make check-docs; .github/workflows/doc-check.yml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MAX_LINES="${DOC_MAX_LINES:-150}"
errors=0

echo "check-doc-placement: repo root = $ROOT"

# 1. Repo-root docs/ must not exist
if [[ -d "$ROOT/docs" ]]; then
  echo "::error::Repo-root docs/ is forbidden. Move content to documentation/ (e.g. documentation/server/ops/)."
  errors=$((errors + 1))
fi

# 2. Long markdown outside allowlist
is_allowed() {
  local rel="$1"
  # Entire canonical tree + Cursor config
  [[ "$rel" == documentation/* ]] && return 0
  [[ "$rel" == .cursor/* ]] && return 0
  [[ "$rel" == .claude/* ]] && return 0
  case "$rel" in
    .github/pull_request_template.md) return 0 ;;
    AGENTS.md|CLAUDE.md|ARCHITECTURE.md|setup.md|README.md) return 0 ;;
    Client/ARCHITECTURE.md|Client/README.md|Client/packages/README.md) return 0 ;;
    Server/ARCHITECTURE.md|Server/README.md) return 0 ;;
    Client/packages/*/README.md) return 0 ;;
    Server/tests/README.md) return 0 ;;
    scripts/*/README.md) return 0 ;;
    pitch/*|deck/*|investor/*) return 0 ;;
  esac
  [[ "$rel" == Server/app/* ]] && return 0
  return 1
}

should_skip_path() {
  local rel="$1"
  [[ "$rel" == Client/apps/mobile/ios/Pods/* ]] && return 0
  [[ "$rel" == */node_modules/* ]] && return 0
  [[ "$rel" == Server/.venv/* ]] && return 0
  [[ "$rel" == Server/.venv-ci/* ]] && return 0
  [[ "$rel" == Client/dist/* ]] && return 0
  [[ "$rel" == Client/coverage/* ]] && return 0
  [[ "$rel" == .git/* ]] && return 0
  return 1
}

while IFS= read -r -d '' file; do
  rel="${file#"$ROOT"/}"
  rel="${rel#./}"
  if should_skip_path "$rel"; then
    continue
  fi
  if is_allowed "$rel"; then
    continue
  fi
  lines=$(wc -l < "$file" | tr -d ' ')
  if [[ "$lines" -gt "$MAX_LINES" ]]; then
    echo "::error::Long markdown ($lines lines) outside allowed paths: $rel (max $MAX_LINES). Move to documentation/ or trim."
    errors=$((errors + 1))
  fi
done < <(find . \
  \( -path './.git' -o -path './node_modules' -o -path './Client/node_modules' -o -path './Client/apps/mobile/ios/Pods' -o -path './Server/.venv' -o -path './Server/.venv-ci' -o -path './.cursor/.agent-tools' -o -path './.ruff_cache' -o -name '__pycache__' -o -path './Client/dist' -o -path './Client/coverage' \) -prune \
  -o -name '*.md' -print0)

if [[ "$errors" -gt 0 ]]; then
  echo "check-doc-placement: FAILED ($errors issue(s))"
  exit 1
fi

echo "check-doc-placement: OK"
