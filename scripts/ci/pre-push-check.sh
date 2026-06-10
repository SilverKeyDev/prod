#!/usr/bin/env bash
# Scoped push checks: client typecheck and/or OpenAPI contract tests when the push
# touches those trees. `make pre-push-check` (TTY) runs both; git push uses stdin.
# Git hook sets PRE_PUSH_ADVISORY=1 (never blocks). Set PRE_PUSH_BLOCKING=1 to fail.
# Full Vitest/pytest and make lint run in CI on PRs.
set -euo pipefail

ADVISORY=0
if [[ "${PRE_PUSH_ADVISORY:-}" == "1" ]]; then
  ADVISORY=1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/ci/githook-path-filters.sh
source "$ROOT/scripts/ci/githook-path-filters.sh"

RUN_TC=false
RUN_CONTRACT=false

if [[ -t 0 ]] || [[ "${PRE_PUSH_FULL:-}" == "1" ]]; then
  RUN_TC=true
  RUN_CONTRACT=true
else
  PUSH_FILES=()
  while IFS= read -r path; do
    [[ -n "$path" ]] && PUSH_FILES+=("$path")
  done < <(githook_collect_push_changed_files || true)
  if [[ "${#PUSH_FILES[@]}" -eq 0 ]]; then
    echo "pre-push: skipped (no file changes in push range)"
    exit 0
  fi
  if githook_files_need_client_typecheck "${PUSH_FILES[@]}"; then
    RUN_TC=true
  fi
  if githook_files_need_openapi_contract "${PUSH_FILES[@]}"; then
    RUN_CONTRACT=true
  fi
fi

if [[ "$RUN_TC" != true && "$RUN_CONTRACT" != true ]]; then
  echo "pre-push: skipped (no Client or OpenAPI changes in push)"
  exit 0
fi

TC_STATUS=0
CONTRACT_STATUS=0
TC_PID=""
CONTRACT_PID=""

if [[ "$RUN_TC" == true && "$RUN_CONTRACT" == true ]]; then
  echo "pre-push: client typecheck + OpenAPI contract tests (parallel)…"
elif [[ "$RUN_TC" == true ]]; then
  echo "pre-push: client typecheck…"
else
  echo "pre-push: OpenAPI contract tests…"
fi

if [[ "$RUN_TC" == true ]]; then
  (
    cd Client
    pnpm typecheck
  ) &
  TC_PID=$!
fi

if [[ "$RUN_CONTRACT" == true ]]; then
  (
    cd Server
    if [[ ! -x .venv/bin/python ]]; then
      echo "pre-push: skipped contract tests (Server/.venv not found). Run: make setup" >&2
      exit 0
    fi
    .venv/bin/python -m pytest tests/contract/test_openapi_contracts.py -q -o addopts=
  ) &
  CONTRACT_PID=$!
fi

if [[ -n "$TC_PID" ]]; then
  wait "$TC_PID" || TC_STATUS=$?
fi
if [[ -n "$CONTRACT_PID" ]]; then
  wait "$CONTRACT_PID" || CONTRACT_STATUS=$?
fi

if [[ "$TC_STATUS" -ne 0 || "$CONTRACT_STATUS" -ne 0 ]]; then
  echo "pre-push: issues (typecheck exit=$TC_STATUS, contract tests exit=$CONTRACT_STATUS)" >&2
  echo "pre-push: before merge run: make lint | make openapi-verify" >&2
  if [[ "$ADVISORY" -eq 1 ]]; then
    exit 0
  fi
  exit 1
fi

echo "pre-push: checks passed."
