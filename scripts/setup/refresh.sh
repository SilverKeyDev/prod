#!/usr/bin/env bash
# Refresh after git pull: clear stale caches, Client deps, Server pip (existing venv).
# Usage: ./scripts/setup/refresh.sh [--ci] [--secrets] [--reset-db] [--no-install] [--no-clean] [--aggressive-clean]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

NO_INSTALL=false
RUN_CLEAN=true
AGGRESSIVE_CLEAN=false
RUN_SECRETS=false
RESET_DB=false
BOOTSTRAP_CI=false
for arg in "$@"; do
  case "$arg" in
    --secrets) RUN_SECRETS=true ;;
    --reset-db) RESET_DB=true ;;
    --ci) BOOTSTRAP_CI=true ;;
    --no-install) NO_INSTALL=true ;;
    --no-clean) RUN_CLEAN=false ;;
    --aggressive-clean) AGGRESSIVE_CLEAN=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--ci] [--secrets] [--reset-db] [--no-install] [--no-clean] [--aggressive-clean]" >&2
      exit 1
      ;;
  esac
done

# shellcheck source=lib/deps.sh
source "${ROOT}/scripts/lib/deps.sh"
if [[ "$NO_INSTALL" == true ]]; then
  DEPS_NO_INSTALL=true
fi
DEPS_SKIP_AWS=true

echo "==> Checking prerequisites (node, pnpm, python)"
if ! deps_run_scan "$ROOT"; then
  echo "refresh: prerequisite check failed. See setup.md or run ./scripts/setup/check-deps.sh" >&2
  exit 1
fi

if [[ -d "$ROOT/scripts" ]]; then
  echo "==> scripts: chmod +x on *.sh under scripts/"
  find "$ROOT/scripts" -type f -name '*.sh' -exec chmod +x {} +
fi

if [[ "$RUN_CLEAN" == true ]]; then
  echo "==> Clean regenerable dev caches"
  # shellcheck source=lib/clean-caches.sh
  source "${ROOT}/scripts/lib/clean-caches.sh"
  clean_dev_caches "$ROOT" "$AGGRESSIVE_CLEAN"
fi

echo "==> Client: pnpm install"
(cd Client && pnpm install)

bootstrap_args=(--refresh-deps)
if [[ "$BOOTSTRAP_CI" == true ]]; then
  bootstrap_args+=(--ci)
fi

echo "==> Server: refresh Python deps (bash Server/scripts/bootstrap-venv.sh ${bootstrap_args[*]})"
bash Server/scripts/bootstrap-venv.sh "${bootstrap_args[@]}"

if [[ "$RUN_SECRETS" == true ]]; then
  echo "==> Server: secrets"
  sh Server/scripts/secrets.sh "${AWS_REGION:-us-east-2}" "${AWS_PROFILE:-}"
fi

if [[ "$RESET_DB" == true ]]; then
  echo "==> Local dev database: reset and migrate"
  make db-reset
  make migrate
fi

echo "refresh: done"
