#!/usr/bin/env bash
# Path filters for git hooks — keep commit/push gates scoped to relevant changes.
set -euo pipefail

# OpenAPI contract surface (commit drift + push contract tests).
readonly GITHOOK_OPENAPI_PATTERN='^(openapi/|openapi\.yaml|Client/packages/types/api\.generated\.ts|Server/app/schemas/generated\.py)'

# Any Client tree change (push typecheck).
readonly GITHOOK_CLIENT_PATTERN='^Client/'

githook_any_path_matches() {
  local pattern="$1"
  shift
  local path
  for path in "$@"; do
    [[ -z "$path" ]] && continue
    if [[ "$path" =~ $pattern ]]; then
      return 0
    fi
  done
  return 1
}

githook_files_need_openapi_drift() {
  githook_any_path_matches "$GITHOOK_OPENAPI_PATTERN" "$@"
}

githook_files_need_client_typecheck() {
  githook_any_path_matches "$GITHOOK_CLIENT_PATTERN" "$@"
}

githook_files_need_openapi_contract() {
  githook_any_path_matches "$GITHOOK_OPENAPI_PATTERN" "$@"
}

# Emit unique paths changed by refs on stdin (pre-push hook format).
githook_collect_push_changed_files() {
  local local_ref local_sha remote_ref remote_sha
  local range base
  local -a all=()

  while read -r local_ref local_sha remote_ref remote_sha; do
    if [[ -z "${local_sha:-}" || "$local_sha" == "0000000000000000000000000000000000000000" ]]; then
      continue
    fi

    if [[ "${remote_sha:-}" == "0000000000000000000000000000000000000000" ]]; then
      range=""
      for main_ref in origin/main origin/develop main develop; do
        if base="$(git merge-base "$main_ref" "$local_sha" 2>/dev/null)" && [[ -n "$base" ]]; then
          range="${base}..${local_sha}"
          break
        fi
      done
      if [[ -z "$range" ]]; then
        range="$local_sha"
      fi
    else
      range="${remote_sha}..${local_sha}"
    fi

    while IFS= read -r path; do
      [[ -n "$path" ]] && all+=("$path")
    done < <(git diff --name-only "$range" 2>/dev/null || true)
  done

  if [[ "${#all[@]}" -eq 0 ]]; then
    return 0
  fi

  printf '%s\n' "${all[@]}" | LC_ALL=C sort -u
}
