#!/usr/bin/env bash
# Does-it-run smoke gate entry point (CI + local make does-it-run).
# Usage:
#   bash scripts/ci/does-it-run.sh --mode frontend
#   bash scripts/ci/does-it-run.sh --mode backend-light
#   bash scripts/ci/does-it-run.sh --mode docker
#   bash scripts/ci/does-it-run.sh --mode all-light
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${DOES_IT_RUN_MODE:-all-light}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    -h | --help)
      echo "Usage: $0 [--mode frontend|backend-light|docker|all-light]"
      exit 0
      ;;
    *)
      echo "does-it-run: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

run_mode() {
  local mode="$1"
  echo "does-it-run: === mode ${mode} ==="
  case "$mode" in
    frontend)
      bash "$ROOT/scripts/ci/does-it-run-frontend.sh"
      ;;
    backend-light)
      bash "$ROOT/scripts/ci/does-it-run-backend-light.sh"
      ;;
    docker)
      bash "$ROOT/scripts/ci/does-it-run-docker.sh"
      ;;
    all-light)
      bash "$ROOT/scripts/ci/does-it-run-frontend.sh"
      bash "$ROOT/scripts/ci/does-it-run-backend-light.sh"
      ;;
    *)
      echo "does-it-run: invalid mode: ${mode}" >&2
      exit 2
      ;;
  esac
}

run_mode "$MODE"
echo "does-it-run: all requested checks passed"
