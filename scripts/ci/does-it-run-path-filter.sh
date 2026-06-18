#!/usr/bin/env bash
# Exit 0 when full Docker prod-parity smoke should run for BASE..HEAD; else exit 1.
# Usage: bash scripts/ci/does-it-run-path-filter.sh <base_sha> <head_sha>
set -euo pipefail

BASE="${1:-}"
HEAD="${2:-HEAD}"

if [[ -z "$BASE" ]]; then
  echo "does-it-run-path-filter: usage: $0 <base_sha> <head_sha>" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PATTERN='^(Dockerfile\.web|scripts/deploy/|\.github/scripts/ec2-deploy\.sh|Server/scripts/gunicorn-entrypoint\.sh|Server/requirements/runtime\.txt)'

run_docker=false
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if [[ "$path" =~ $PATTERN ]]; then
    run_docker=true
    break
  fi
done < <(git diff --name-only "$BASE" "$HEAD" 2>/dev/null || true)

if [[ "$run_docker" == true ]]; then
  echo "does-it-run-path-filter: deploy/docker paths changed — full Docker smoke required"
  exit 0
fi

echo "does-it-run-path-filter: no deploy/docker path changes — skip full Docker smoke"
exit 1
